import React from "react";
import "./index.css";
import { Routes, Route, Link } from "react-router-dom";
import AnalyzerPage from "./pages/IndicesAnalyzerPage";
import MRVDashboard from "./pages/MRVDashboard";

export default function App() {
  return (
    <div className="min-h-screen">
      <header style={{display:'flex', gap:12, alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #e5e7eb'}}>
        <h1 style={{margin:0, fontSize:18}}>Real-time Image Analyzer — MRV</h1>
        <nav style={{display:'flex', gap:8, marginLeft:'auto'}}>
          <Link className="agri-pill" to="/">Analyzer</Link>
          <Link className="agri-pill" to="/mrv">MRV Dashboard</Link>
        </nav>
      </header>
      <main style={{padding:16}}>
        <Routes>
          <Route path="/" element={<AnalyzerPage />} />
          <Route path="/mrv" element={<MRVDashboard />} />
        </Routes>
      </main>
    </div>
  );
}
