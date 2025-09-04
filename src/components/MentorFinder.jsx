import React, { useEffect, useMemo, useState } from 'react'
import { loadICARStaffCSV, mergeStaffIntoCatalog } from '../lib/icarLoader'

function downloadCSV(rows, filename='staff_filtered.csv'){
  if (!rows || !rows.length) return
  const headers = Object.keys(rows[0])
  const esc = (s)=> '"' + String(s||'').replaceAll('"','""') + '"'
  const csv = [headers.join(',')].concat(rows.map(r=> headers.map(h=>esc(r[h])).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  URL.revokeObjectURL(a.href)
}

function copyEmails(rows){
  const list = Array.from(new Set(rows.map(r=>r.email).filter(Boolean))).join('; ')
  if (!list) return
  navigator.clipboard.writeText(list)
  alert('Copied '+ list.split('; ').length +' emails to clipboard')
}

function useHashPrefill({ setCategory, setInstitute, setDepartment, setSubmitted }){
  useEffect(()=>{
    const apply = () => {
      const p = new URLSearchParams(location.hash.slice(1))
      const cat = p.get('category') || ''
      const inst = p.get('institute') || ''
      const dep = p.get('department') || ''
      if (cat) setCategory(cat)
      if (inst) setInstitute(inst)
      if (dep) setDepartment(dep)
      if (cat && inst) setSubmitted(true)
    }
    window.addEventListener('hashchange', apply)
    apply()
    return () => window.removeEventListener('hashchange', apply)
  }, [setCategory, setInstitute, setDepartment, setSubmitted])
}

const PAGE_SIZE = 6

export default function MentorFinder({ onMentorSelect }){
  const [rows, setRows] = useState(null)
  const [category, setCategory] = useState('')
  const [institute, setInstitute] = useState('')
  const [department, setDepartment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useHashPrefill({ setCategory, setInstitute, setDepartment, setSubmitted })

  useEffect(() => { (async () => setRows(await loadICARStaffCSV('/icar_all_staff.csv')))() }, [])

  const catalog = useMemo(() => mergeStaffIntoCatalog({}, rows || []), [rows])
  const categories = useMemo(() => Object.keys(catalog).sort(), [catalog])
  const institutes = useMemo(() => category ? Object.keys(catalog[category] || {}).sort() : [], [catalog, category])
  const departments = useMemo(() => {
    if (!category || !institute) return []
    const staff = (catalog[category] && catalog[category][institute]) || []
    return Array.from(new Set(staff.map(s=>s.dept).filter(Boolean))).sort()
  }, [catalog, category, institute])

  const staffFiltered = useMemo(() => {
    if (!submitted) return []
    let list = category && institute ? (catalog[category]?.[institute] || []) : []
    if (department) list = list.filter(s => (s.dept || '') === department)
    return list
  }, [submitted, catalog, category, institute, department])

  const visibleStaff = useMemo(() => staffFiltered.slice(0, visibleCount), [staffFiltered, visibleCount])

  const onSubmit = (e) => { e?.preventDefault(); setSubmitted(true); setVisibleCount(PAGE_SIZE) }
  const onReset = () => { setCategory(''); setInstitute(''); setDepartment(''); setSubmitted(false); setVisibleCount(PAGE_SIZE) }

  useEffect(() => { setInstitute(''); setDepartment(''); setSubmitted(false) }, [category])
  useEffect(() => { setDepartment(''); setSubmitted(false) }, [institute])

  return (
    <div className="agri-card" style={{display:'grid', gap:12}}>
      <div style={{position:'sticky', top:0, zIndex:2, background:'linear-gradient(90deg,#fff,rgba(255,255,255,.6))', borderRadius:12, padding:8}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <h3 className="agri-gradient-title" style={{margin:0}}>AgriSkill Navigator</h3>
          <div style={{marginLeft:'auto', display:'flex', gap:8}}>
            <span className="agri-badge">{category || 'Category'}</span>
            <span className="agri-badge">{institute || 'Institute'}</span>
            <span className="agri-badge">{department || 'Department'}</span>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto auto', gap:8}}>
        <select value={category} onChange={e=>setCategory(e.target.value)} style={sSel}>
          <option value="">Select Category</option>
          {categories.map((c,i)=>(<option key={i} value={c}>{c}</option>))}
        </select>
        <select value={institute} onChange={e=>setInstitute(e.target.value)} style={sSel} disabled={!category}>
          <option value="">{category ? 'Select Institute' : 'Choose Category first'}</option>
          {institutes.map((inst,i)=>(<option key={i} value={inst}>{inst}</option>))}
        </select>
        <select value={department} onChange={e=>setDepartment(e.target.value)} style={sSel} disabled={!institute}>
          <option value="">{institute ? 'Select Department (optional)' : 'Choose Institute first'}</option>
          {departments.map((d,i)=>(<option key={i} value={d}>{d}</option>))}
        </select>
        <button type="submit" disabled={!category || !institute}>Submit</button>
        <button type="button" onClick={onReset} style={{background:'linear-gradient(90deg,#e2e8f0,#cbd5e1)'}}>Reset</button>
      </form>

      {!rows && <div className="agri-card skeleton" style={{height:120}}/>}
      {!submitted && rows && (
        <div style={{opacity:.8}}>Pick <b>Category → Institute → Department</b> (optional) and press <b>Submit</b>.</div>
      )}

      {submitted && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12}}>
          {visibleStaff.map((m, i) => (
            <div key={i} className="agri-card agri-hover">
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <div style={{width:34, height:34, borderRadius:999, background:'linear-gradient(135deg,#bbf7d0,#a7f3d0)'}}/>
                <div style={{fontWeight:800}}>{m.name || 'Staff'}</div>
              </div>
              <div style={{fontSize:12}}>{m.designation ? <b>{m.designation}</b> : null}{m.dept ? <> · {m.dept}</> : null}</div>
              <div style={{fontSize:12}}>{(m.city||m.state) ? <>{m.city||''}{m.city&&m.state?', ':''}{m.state||''}</> : null}</div>
              {m.email ? <div className="agri-chip" style={{marginTop:6}}>{m.email}</div> : null}
              {m.source_url ? <div style={{fontSize:12, marginTop:6}}><a href={m.source_url} target="_blank" rel="noreferrer">Source</a></div> : null}
              <div style={{display:'flex', gap:8, marginTop:8}}>
                <button onClick={()=>onMentorSelect?.(m)}>Select</button>
                <button onClick={()=>copyEmails([m])} style={{background:'linear-gradient(90deg,#e0f2fe,#bae6fd)'}}>Copy email</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {submitted && visibleStaff.length < staffFiltered.length && (
        <div style={{textAlign:'center'}}>
          <button type="button" onClick={()=>setVisibleCount(v=>v+6)}>Show more</button>
          <div style={{fontSize:12, opacity:.7, marginTop:4}}>{visibleStaff.length}/{staffFiltered.length}</div>
        </div>
      )}

      {submitted && staffFiltered.length > 0 && (
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button onClick={()=>copyEmails(staffFiltered)} style={{background:'linear-gradient(90deg,#e0f2fe,#bae6fd)'}}>Copy all emails</button>
          <button onClick={()=>downloadCSV(staffFiltered)}>Export CSV</button>
        </div>
      )}

      {submitted && staffFiltered.length === 0 && rows && (
        <div className="agri-card">No staff found for the selected filters.</div>
      )}
    </div>
  )
}
const sSel = { width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff' }