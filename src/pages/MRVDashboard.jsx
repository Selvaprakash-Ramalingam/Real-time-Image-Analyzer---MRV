import React, { useEffect, useMemo, useState } from 'react'
import { fetchRecords } from '../services/api'

function toCSV(rows){
  if (!rows.length) return ''
  const cols = ['ts','project','method','class','index','metrics.mean','fraction','area_m2','lat','lon','acc','note']
  const get = (r,k)=>{
    if (k==='class') return r.classType ?? ''
    if (k==='index') return r.indexType ?? ''
    if (k==='metrics.mean') return (r.metrics && Number.isFinite(r.metrics.mean)) ? r.metrics.mean : ''
    if (k==='fraction') return (r.metrics && Number.isFinite(r.metrics.frac)) ? r.metrics.frac : ''
    if (k==='area_m2') return (r.metrics && Number.isFinite(r.metrics.area_m2)) ? r.metrics.area_m2 : ''
    if (k==='lat') return r.location?.lat ?? ''
    if (k==='lon') return r.location?.lon ?? ''
    if (k==='acc') return r.location?.acc ?? ''
    return r[k] ?? ''
  }
  const lines = [cols.join(',')].concat(rows.map(r => cols.map(c => JSON.stringify(get(r,c))).join(',')))
  return lines.join('\n')
}

export default function MRVDashboard(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    (async ()=>{
      try{
        setLoading(true)
        const items = await fetchRecords()
        setRows(items.sort((a,b)=>(b.ts||'').localeCompare(a.ts||'')))
      }catch(e){
        setError(e.message || 'Failed to load')
      }finally{
        setLoading(false)
      }
    })()
  }, [])

  const summary = useMemo(()=>{
    const n = rows.length
    const meanOf = (fn) => {
      if (!n) return 0
      let s=0, c=0
      for (const r of rows){ const v = fn(r); if (Number.isFinite(v)){ s+=v; c++ } }
      return c ? s/c : 0
    }
    return {
      count: n,
      mean_index: meanOf(r => r.metrics?.mean),
      mean_frac: meanOf(r => r.metrics?.frac),
      mean_area: meanOf(r => r.metrics?.area_m2),
    }
  }, [rows])

  function downloadCSV(){
    const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'mrv_records.csv'
    a.click()
  }

  return (
    <div style={{padding:16}}>
      <h2 className="agri-gradient-title" style={{marginTop:0}}>MRV Dashboard</h2>
      <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
        <div className="agri-badge">Records: {summary.count}</div>
        <div className="agri-badge">Avg Index: {summary.mean_index.toFixed(3)}</div>
        <div className="agri-badge">Avg Fraction: {(summary.mean_frac*100).toFixed(1)}%</div>
        <div className="agri-badge">Avg Area: {summary.mean_area.toFixed(2)} m²</div>
        <button className="agri-pill" onClick={downloadCSV}>Export CSV</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{color:'#b91c1c'}}>{error}</p>}

      <div style={{marginTop:12, overflow:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              {['ts','project','method','class','index','metrics.mean','fraction','area_m2','lat','lon','acc','note'].map(h=>(
                <th key={h} style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px 6px'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td style={{padding:'6px'}}>{r.ts}</td>
              <td style={{padding:'6px'}}>{r.project}</td>
              <td style={{padding:'6px'}}>{r.method}</td>
              <td style={{padding:'6px'}}>{r.classType}</td>
              <td style={{padding:'6px'}}>{r.indexType}</td>
              <td style={{padding:'6px'}}>{Number.isFinite(r.metrics?.mean) ? r.metrics.mean.toFixed(3) : ''}</td>
              <td style={{padding:'6px'}}>{Number.isFinite(r.metrics?.frac) ? (r.metrics.frac*100).toFixed(1)+'%' : ''}</td>
              <td style={{padding:'6px'}}>{Number.isFinite(r.metrics?.area_m2) ? r.metrics.area_m2.toFixed(2) : ''}</td>
              <td style={{padding:'6px'}}>{r.location?.lat?.toFixed ? r.location.lat.toFixed(6) : r.location?.lat}</td>
              <td style={{padding:'6px'}}>{r.location?.lon?.toFixed ? r.location.lon.toFixed(6) : r.location?.lon}</td>
              <td style={{padding:'6px'}}>{Number.isFinite(r.location?.acc) ? Math.round(r.location.acc) : ''}</td>
              <td style={{padding:'6px'}}>{r.note || ''}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
