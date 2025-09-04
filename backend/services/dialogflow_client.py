# Minimal placeholder for Dialogflow CX interaction.
# In production, use dialogflow CX client libraries to start a session and stream responses.
from typing import Dict

class SimulationRunner:
    def run(self, role: str, context: Dict) -> Dict:
        # Return a canned simulation prompt/response for demo
        if role.lower().startswith("drone"):
            return {"role": "Drone Data Scientist", "day": [
                "08:30 Standup with agronomy & flight ops",
                "10:00 Process NDVI imagery (GEE/BigQuery)",
                "14:00 Field validation & yield model update",
                "16:30 Report risks & interventions"
            ]}
        return {"role": role, "day": ["09:00 Research", "13:00 Field visit", "16:00 Stakeholder sync"]}
