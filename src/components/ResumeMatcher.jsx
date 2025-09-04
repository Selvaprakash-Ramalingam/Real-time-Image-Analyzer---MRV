import React, { useMemo, useState } from 'react'
import { loadICARStaffCSV } from '../lib/icarLoader'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const STOP = new Set(['a','an','the','in','on','at','for','and','or','of','to','from','by','with','as','is','are','be','this','that','these','those','i','you','he','she','we','they','it','my','your','our','their','his','her','its','me','us','them','skills','experience','education','project','projects','work','resume','cv'])

function extractKeywords(text){
  const words = (text || '').toLowerCase().replace(/[^a-z0-9\s\-]/g,' ').split(/\s+/).filter(Boolean)
  const freq = {}; for (const w of words){ if (w.length>=3 && !STOP.has(w)) freq[w]=(freq[w]||0)+1 }
  return Object.entries(freq).sort((a,b)=> b[1]-a[1]).map(([w])=>w).slice(0,12)
}

export default function ResumeMatcher(){
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const keywords = useMemo(()=> extractKeywords(text), [text])

  async function onFile(e){
    const file = e.target.files?.[0]; if (!file) return
    setFileName(file.name); setText(await file.text())
  }

  async function localFallback(){
    const staff = await loadICARStaffCSV('/icar_all_staff.csv')
    if (!keywords.length) return []
    const tokens = new Set(keywords.map(k=>k.toLowerCase()))
    const scored = staff.map(r => {
      const hay = (r.designation + ' ' + r.dept + ' ' + r.institute + ' ' + r.city + ' ' + r.state).toLowerCase()
      let score = 0; tokens.forEach(t => { if (hay.includes(t)) score++ })
      return { score, ...r }
    }).filter(x => x.score>0).sort((a,b)=> b.score-a.score).slice(0,50)
    return scored
  }

  async function onMatch(){
    setLoading(true); setError(''); setResults([])
    try{
      const params = new URLSearchParams()
      if (keywords.length) params.set('q', keywords.join(' '))
      params.set('limit','50')
      const res = await fetch(`${API_BASE}/api/v1/mentors/match?`+params.toString())
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      let list = data.mentors || []
      // inject lightweight score on client even for API results
      if (list.length){
        const tokens = new Set(keywords.map(k=>k.toLowerCase()))
        list = list.map(r => {
          const hay = (r.designation + ' ' + r.dept + ' ' + r.institute + ' ' + r.city + ' ' + r.state).toLowerCase()
          let score = 0; tokens.forEach(t => { if (hay.includes(t)) score++ })
          return { score, ...r }
        }).sort((a,b)=> b.score-a.score)
      }
      if (!list.length) list = await localFallback()
      setResults(list)
    }catch(e){
      const list = await localFallback()
      if (list.length===0) setError('No mentors found. Start backend or add more resume keywords.')
      setResults(list)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="agri-card" style={{display:'grid', gap:12}}>
      <h4 className="agri-gradient-title">Upload Resume → Get Suitable Mentors</h4>
      <input type="file" accept=".txt,.md,.pdf,.doc,.docx" onChange={onFile} />
      {fileName && <div style={{fontSize:12, opacity:.7}}>Loaded: {fileName}</div>}
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={6} placeholder="Paste resume text here…" style={sTxt}/>
      <div style={{fontSize:12}}><b>Extracted keywords:</b> {keywords.length ? keywords.map((k,i)=> <span key={i} className='agri-chip' style={{marginRight:6}}>{k}</span>) : '—'}</div>
      <button onClick={onMatch} disabled={loading || (!text && !keywords.length)}>{loading ? 'Matching…' : 'Find Mentors'}</button>
      {error && <div style={{color:'#b00020'}}>{error}</div>}
      {results.length === 0 && !loading && (<div className="agri-card">No mentors found. Try adding more details to your resume.</div>)}
      {results.length > 0 && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12}}>
          {results.slice(0,18).map((m,i)=> (
            <div key={i} className="agri-card agri-hover">
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <div style={{width:34, height:34, borderRadius:999, background:'linear-gradient(135deg,#fecaca,#fde68a)'}}/>
                <div style={{fontWeight:800}}>{m.name || 'Staff'}</div>
              </div>
              <div style={{fontSize:12}}>{m.designation ? <b>{m.designation}</b> : null}{m.dept ? <> · {m.dept}</> : null} {m.score != null ? <span className='agri-badge' style={{marginLeft:6}}>score {m.score}</span> : null}</div>
              <div style={{fontSize:12}}>{(m.city||m.state) ? <>{m.city||''}{m.city&&m.state?', ':''}{m.state||''}</> : null}</div>
              {m.email ? <div className="agri-chip" style={{marginTop:6}}>{m.email}</div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const sTxt = { width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', minHeight:120 }