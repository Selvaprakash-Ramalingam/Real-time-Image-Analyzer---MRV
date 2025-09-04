
from fastapi import APIRouter, Query
from typing import List, Optional
from services.staff_loader import load_staff

router = APIRouter()
_STAFF = load_staff()

def _match_any_tokens(text: str, tokens: List[str]) -> bool:
    t = (text or '').lower()
    return any(tok in t for tok in tokens)

@router.get("/match")
def match_interests(
    q: Optional[str] = None,
    category: Optional[str] = None,
    institute: Optional[str] = None,
    dept: Optional[str] = Query(None, alias="department"),
    city: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = 50,
):
    rows = _STAFF

    if category: rows = [r for r in rows if r['category'] == category]
    if institute: rows = [r for r in rows if r['institute'] == institute]
    if dept: rows = [r for r in rows if r['dept'] == dept]
    if city: rows = [r for r in rows if r['city'] == city]
    if state: rows = [r for r in rows if r['state'] == state]

    if q:
        tokens = [tok.strip().lower() for tok in q.split() if tok.strip()]
        if tokens:
            cand = []
            for r in rows:
                haystack = " ".join([str(r.get(k,'')) for k in ['name','designation','dept','institute','city','state']])
                if _match_any_tokens(haystack, tokens):
                    cand.append(r)
            rows = cand

    if q and not rows:
        rows = _STAFF[:limit]

    return {"mentors": rows[:max(1,min(limit,500))]}
