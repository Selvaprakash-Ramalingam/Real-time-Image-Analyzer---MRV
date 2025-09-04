import os
from typing import List, Dict

# Replace with real neo4j driver integration for GCP Marketplace Neo4j
class CareerGraph:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")

    def get_careers_for_skills(self, skills: List[str]) -> List[Dict]:
        # Demo recommendations; replace with graph query (MATCH (s:Skill)-[:REQUIRES]->(c:Career)...)
        base = [
            {"career": "Precision Agriculture Specialist", "match": 0.86, "skills": ["Precision Farming", "GIS"]},
            {"career": "Drone Data Scientist", "match": 0.81, "skills": ["Drones", "Remote Sensing", "Python"]},
            {"career": "Climate-Smart Agriculture Advisor", "match": 0.78, "skills": ["Soil Science", "Data Analysis"]},
        ]
        if not skills:
            return base
        scored = []
        sl = set(s.lower() for s in skills)
        for r in base:
            overlap = len(sl.intersection({s.lower() for s in r["skills"]})) / max(1, len(r["skills"]))
            scored.append({**r, "match": round(0.6 + 0.4 * overlap, 2)})
        return sorted(scored, key=lambda x: x["match"], reverse=True)
