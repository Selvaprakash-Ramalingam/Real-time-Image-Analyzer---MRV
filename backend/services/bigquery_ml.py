from typing import List, Dict

# Stub to illustrate BQ ML usage; swap with google-cloud-bigquery calls
class CareerForecaster:
    def train(self, table: str) -> Dict:
        # Run CREATE MODEL ... in BigQuery ML
        return {"status": "trained", "table": table}

    def predict(self, model: str, horizon_months: int = 24) -> List[Dict]:
        # Run SELECT * FROM ML.FORECAST(MODEL ...) in BigQuery ML
        return [{"career": "Drone Data Scientist", "month": i, "demand_index": 50 + i} for i in range(horizon_months)]
