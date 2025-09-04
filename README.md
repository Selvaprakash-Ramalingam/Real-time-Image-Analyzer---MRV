# AgriSkill Navigator — Routed Frontend

This is a routed React (Vite) frontend with three working tools:
- **AgriSkill Navigator** (`/agriskill`): Career graph, mentor list, skill analyzer with radar & recommendations.
- **Real-time Image-based Indices Analyzer** (`/indices`): Compute **VARI** and **GLI** indices from standard RGB images and visualize them on-canvas.
- **GenAI for Precision Farming** (`/genai`): Simple local chat advisor (stub), ready to be wired to FastAPI/Vertex AI.

## Run
```bash
cd frontend/web
npm install
npm run dev
```

Open the URL shown by Vite (usually http://localhost:5173).

> No backend required for this demo. Pages are self-contained and can be wired to an API later.
