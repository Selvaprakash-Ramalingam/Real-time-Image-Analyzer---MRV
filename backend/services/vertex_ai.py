import os
from typing import List

# Placeholder: integrate Google Cloud Vertex AI Text/Embeddings for real usage.
class VertexAISkillsExtractor:
    def __init__(self):
        self.project_id = os.getenv("PROJECT_ID", "local")
        self.location = os.getenv("LOCATION", "us-central1")

    def extract_skills(self, text: str) -> List[str]:
        if not text:
            return []
        # Very naive stub for hackathon demo; replace with Vertex AI + custom extractor
        seed = ["Precision Farming", "Remote Sensing", "GIS", "Soil Science", "Agri-Business", "Drones"]
        found = [s for s in seed if s.lower() in text.lower()]
        # Always add a couple of best-guess skills
        return list({*found, "Data Analysis", "Python"})
