"""
Soldex ETL: EnergyReturn-ShockAbsorption.xlsx -> public/data/{shoes,meta}.json

Strategy
--------
- Load every sheet without a header
- Walk row-by-row; whenever a row looks like a header (contains 'Brand' and
  'Version' and at least one of HER/HSA/FER/FSA), use it as the active schema
- Subsequent rows are treated as data rows under that schema, until another
  header / blank / 'average' summary row appears
- Coerce types, build slug ID, dedupe by ID and merge category provenance
- Compute derived fields and emit shoes.json + meta.json
"""

from __future__ import annotations

import json
import math
import re
import sys
import unicodedata
from collections import OrderedDict, defaultdict
from datetime import date
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]  # repo root (legacy/scripts/.. -> legacy/.. -> root)
XLSX = ROOT / "legacy" / "data" / "EnergyReturn-ShockAbsorption.xlsx"
OUT_DIR = ROOT / "public" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Canonical field map: header label (lowercased, stripped) -> JSON key
HEADER_MAP = {
    "type": "type",
    "ty": "type",
    "brand": "brand",
    "version": "version",
    "her": "her",
    "hsa": "hsa",
    "fer": "fer",
    "fsa": "fsa",
    "w": "weightG",
    "w-us-m9": "weightG",
    "pr": "priceIdr",
    "heel": "heel",
    "fore": "fore",
    "drop": "drop",
    "width": "width",
    "toe": "toe",
    "m-fore": "mFore",
    "o-thick": "oThick",
    "drem": "drem",
    "o-dur%": "oDurPct",
    "o-stay": "oStay",
    "trac": "trac",
    "m-soft": "mSoft",
    "flexstiff": "flexStiff",
    "torsrigid": "torsRigid",
    "minus": "minus",
    "foam": "foam",
    "foam?": "foam",
    "myapprox": "myApprox",
    "up-foam": "upFoam",
    "re-buy": "reBuy",
    "results": "reBuy",
    "conclusion": "conclusion",
}

NUMERIC_FIELDS = {
    "her", "hsa", "fer", "fsa", "weightG", "priceIdr",
    "heel", "fore", "drop", "width", "toe", "mFore",
    "oThick", "drem", "oDurPct", "oStay", "trac", "mSoft",
    "flexStiff", "torsRigid", "myApprox", "upFoam",
}
INT_FIELDS = {"hsa", "fsa", "weightG", "priceIdr", "myApprox"}
ENUM_FIELDS = {"type", "foam"}


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def is_blank(v) -> bool:
    if v is None:
        return True
    if isinstance(v, float) and math.isnan(v):
        return True
    if isinstance(v, str) and v.strip() == "":
        return True
    return False


def header_index(row) -> dict[int, str] | None:
    """Return {col_idx: json_key} if this row looks like a header, else None."""
    labels = [str(v).strip().lower() if not is_blank(v) else "" for v in row]
    if "brand" not in labels or "version" not in labels:
        return None
    has_metric = any(l in labels for l in ("her", "hsa", "fer", "fsa"))
    if not has_metric:
        return None
    mapping: dict[int, str] = {}
    for i, lbl in enumerate(labels):
        key = HEADER_MAP.get(lbl)
        if key:
            mapping[i] = key
    return mapping


def coerce(key: str, val):
    if is_blank(val):
        return None
    if key in NUMERIC_FIELDS:
        if isinstance(val, (int, float)):
            f = float(val)
            if math.isnan(f) or math.isinf(f):
                return None
            if key in INT_FIELDS:
                return int(round(f))
            return round(f, 2)
        s = str(val).strip()
        # tolerate "4out5" style ratings -> map to 0-1 scale * 5? Just store float fraction
        m = re.match(r"^(\d+(?:\.\d+)?)\s*out\s*of?\s*(\d+(?:\.\d+)?)$", s, re.I)
        if m:
            num, den = float(m.group(1)), float(m.group(2))
            return round(num / den * 5, 2) if den else None
        m = re.match(r"^-?\d+(\.\d+)?$", s)
        if m:
            f = float(s)
            if key in INT_FIELDS:
                return int(round(f))
            return round(f, 2)
        return None
    # text/enum
    s = str(val).strip()
    if key in ENUM_FIELDS:
        s = s.upper() if key == "type" else s
    return s if s else None


def parse_sheet(name: str, df: pd.DataFrame) -> list[dict]:
    rows = df.values.tolist()
    out: list[dict] = []
    schema: dict[int, str] | None = None
    for raw in rows:
        h = header_index(raw)
        if h is not None:
            schema = h
            continue
        if schema is None:
            continue
        # blank row -> reset (keep schema but skip)
        if all(is_blank(v) for v in raw):
            continue
        # average / summary rows
        joined = " ".join(str(v).lower() for v in raw if not is_blank(v))
        if "average" in joined:
            continue
        rec: dict = {}
        for col, key in schema.items():
            if col >= len(raw):
                continue
            v = coerce(key, raw[col])
            if v is not None:
                rec[key] = v
        # require brand + version, plus at least one numeric metric
        if "brand" not in rec or "version" not in rec:
            continue
        if not any(k in rec for k in ("her", "fer", "hsa", "fsa")):
            continue
        rec["categories"] = [name]
        out.append(rec)
    return out


def merge_records(records: list[dict]) -> list[dict]:
    by_id: "OrderedDict[str, dict]" = OrderedDict()
    for r in records:
        rid = slugify(f"{r['brand']} {r['version']}")
        r["id"] = rid
        if rid not in by_id:
            by_id[rid] = r
            continue
        existing = by_id[rid]
        # union categories
        cats = list(dict.fromkeys((existing.get("categories", []) + r.get("categories", []))))
        # merge: prefer richest (most non-null keys) as base
        a_score = sum(1 for v in existing.values() if v is not None)
        b_score = sum(1 for v in r.values() if v is not None)
        base, other = (existing, r) if a_score >= b_score else (r, existing)
        merged = dict(base)
        for k, v in other.items():
            if k not in merged or merged.get(k) in (None, ""):
                merged[k] = v
        merged["categories"] = cats
        merged["id"] = rid
        by_id[rid] = merged
    return list(by_id.values())


def derive(rec: dict) -> dict:
    her, fer = rec.get("her"), rec.get("fer")
    hsa, fsa = rec.get("hsa"), rec.get("fsa")
    pr = rec.get("priceIdr")
    if her is not None and fer is not None:
        rec["avgEr"] = round((her + fer) / 2, 2)
        rec["herMinusFer"] = round(her - fer, 2)
    if hsa is not None and fsa is not None:
        rec["avgSa"] = round((hsa + fsa) / 2, 2)
    if rec.get("avgEr") is not None and pr:
        rec["valueIdx"] = round(rec["avgEr"] / (pr / 1_000_000), 2)
    return rec


def main() -> int:
    if not XLSX.exists():
        print(f"ERROR: {XLSX} not found", file=sys.stderr)
        return 1

    xl = pd.ExcelFile(XLSX, engine="openpyxl")
    all_records: list[dict] = []
    per_sheet_counts: dict[str, int] = {}
    for s in xl.sheet_names:
        df = pd.read_excel(xl, sheet_name=s, header=None)
        recs = parse_sheet(s, df)
        per_sheet_counts[s] = len(recs)
        all_records.extend(recs)

    merged = merge_records(all_records)
    merged = [derive(r) for r in merged]

    # sort for determinism
    merged.sort(key=lambda r: (r["brand"].lower(), r["version"].lower()))

    # Build meta
    def collect(key):
        vals = {r.get(key) for r in merged if r.get(key)}
        return sorted(v for v in vals if v)

    def num_range(key):
        vs = [r[key] for r in merged if r.get(key) is not None]
        return [min(vs), max(vs)] if vs else None

    meta = {
        "generatedAt": date.today().isoformat(),
        "shoeCount": len(merged),
        "brands": collect("brand"),
        "foams": collect("foam"),
        "types": collect("type"),
        "categories": list(xl.sheet_names),
        "ranges": {
            "her": num_range("her"),
            "fer": num_range("fer"),
            "weightG": num_range("weightG"),
            "priceIdr": num_range("priceIdr"),
            "drop": num_range("drop"),
        },
    }

    (OUT_DIR / "shoes.json").write_text(
        json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (OUT_DIR / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Quality report
    print("=== Soldex ETL report ===")
    print(f"Source : {XLSX}")
    print(f"Output : {OUT_DIR}")
    print("Per-sheet rows kept:")
    for s, n in per_sheet_counts.items():
        print(f"  {s:14s} {n}")
    print(f"Raw rows kept       : {len(all_records)}")
    print(f"Unique shoes (final): {len(merged)}")
    missing = [r["id"] for r in merged if r.get("her") is None or r.get("fer") is None]
    print(f"Missing HER/FER     : {len(missing)}")
    no_price = [r["id"] for r in merged if not r.get("priceIdr")]
    print(f"Missing price       : {len(no_price)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
