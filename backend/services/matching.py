from typing import Dict, List

# Placeholder for Vertex AI Matching Engine; using rule-based match for demo
class ProfileMatcher:
    def match_profiles(self, profile: Dict) -> List[Dict]:
        interests = set((profile or {}).get("interests", []))
        pool = [
            {"name": "Anita (ICAR)", "tags": ["Soil Science", "Climate"]},
            {"name": "Ravi (AgriTech Co.)", "tags": ["Drones", "Computer Vision"]},
            {"name": "Fatima (NGO)", "tags": ["Agri-Business", "Rural Dev"]},
        ]
        if not interests:
            return pool
        def score(p): return len(interests.intersection(set(p["tags"])))
        return sorted(pool, key=score, reverse=True)
