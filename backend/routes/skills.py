from fastapi import APIRouter, UploadFile, File, Form
from services.vertex_ai import VertexAISkillsExtractor

router = APIRouter()
extractor = VertexAISkillsExtractor()

@router.post("/extract")
async def extract_skills(text: str = Form(None), file: UploadFile = File(None)):
    content = text
    if not content and file:
        content = (await file.read()).decode(errors="ignore")
    skills = extractor.extract_skills(content or "")
    return {"skills": skills}
