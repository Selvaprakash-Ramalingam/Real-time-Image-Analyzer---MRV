import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="AgriSkill Navigator API", version="0.1.0")

# CORS for local dev + simple wildcard for hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers

@app.get("/healthz")
def healthz():
    return {"status": "ok", "project": os.getenv("PROJECT_ID", "local")}




from fastapi import Body
from storage import append_record, list_records, get_record

@app.post("/records")
async def create_record(payload: dict = Body(...)):
    rid = append_record(payload)
    return {"id": rid, "ok": True}

@app.get("/records")
def records():
    return {"items": list_records()}

@app.get("/records/{rid}")
def record_by_id(rid: str):
    rec = get_record(rid)
    if not rec:
        return JSONResponse({"error": "not_found"}, status_code=404)
    return rec
