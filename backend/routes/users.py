from fastapi import APIRouter
router = APIRouter()

@router.get("/me")
def me():
    # Replace with Firebase Auth context; stubbed for hackathon
    return {"id": "demo-user", "name": "Student", "role": "learner"}
