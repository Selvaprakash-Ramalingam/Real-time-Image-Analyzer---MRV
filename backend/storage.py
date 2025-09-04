import json, os, time, hashlib
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "records.jsonl"

def _hash_id(payload: dict) -> str:
    h = hashlib.sha256(json.dumps(payload, sort_keys=True).encode('utf-8') + str(time.time()).encode()).hexdigest()
    return h[:16]

def append_record(payload: dict) -> str:
    rid = payload.get("id") or _hash_id(payload)
    payload["id"] = rid
    with DB_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    return rid

def list_records() -> list:
    res = []
    if not DB_PATH.exists():
        return res
    with DB_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try:
                res.append(json.loads(line))
            except Exception:
                pass
    return res

def get_record(rid: str) -> dict | None:
    for row in list_records():
        if row.get("id") == rid:
            return row
    return None
