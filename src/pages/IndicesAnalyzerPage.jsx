import React, { useEffect, useRef, useState } from 'react'
import { saveRecord } from '../services/api'
import GeoCapture from '../components/GeoCapture'

// ---- Index computation ----
function computeIndex(imgData, w, h, type='ExG'){
  const out = new Float32Array(w*h)
  let min = Infinity, max = -Infinity
  for (let i=0;i<w*h;i++){
    const r = imgData[i*4+0], g = imgData[i*4+1], b = imgData[i*4+2]
    let v = 0
    if (type === 'ExG') v = 2*g - r - b
    else if (type === 'ExR') v = 1.4*r - g
    else if (type === 'NGRDI') v = (g - r) / (g + r + 1e-6)
    else if (type === 'ExGR') v = (2*g - r - b) - (1.4*r - g)
    else v = 2*g - r - b
    out[i] = v
    if (v < min) min = v
    if (v > max) max = v
  }
  return { out, min, max }
}

function normalizeToRGBA(values, w, h, min, max){
  const out = new ImageData(w, h)
  const den = (max - min) || 1
  for (let i=0;i<w*h;i++){
    const t = (values[i] - min) / den
    const v = Math.max(0, Math.min(1, t))
    const k = i*4
    out.data[k]   = Math.round(255 * v)
    out.data[k+1] = Math.round(255 * (1-v))
    out.data[k+2] = 0
    out.data[k+3] = 255
  }
  return out
}

function varianceOfLaplacian(imgData, w, h){
  const gray = new Float32Array(w*h)
  for (let i=0;i<w*h;i++){
    const r=imgData[i*4], g=imgData[i*4+1], b=imgData[i*4+2]
    gray[i] = 0.299*r + 0.587*g + 0.114*b
  }
  const idx=(x,y)=>y*w+x
  let mean=0
  const lap = new Float32Array(w*h)
  for (let y=1;y<h-1;y++){
    for (let x=1;x<w-1;x++){
      const v = -gray[idx(x,y-1)] - gray[idx(x-1,y)] + 4*gray[idx(x,y)] - gray[idx(x+1,y)] - gray[idx(x,y+1)]
      lap[idx(x,y)]=v; mean+=v
    }
  }
  mean/= (w*h)
  let varsum=0
  for (let i=0;i<lap.length;i++){ const d=lap[i]-mean; varsum+=d*d }
  return Math.sqrt(varsum/(lap.length||1))
}

function otsuThreshold(values){
  const n = values.length
  let min=Infinity, max=-Infinity
  for (let i=0;i<n;i++){ const v=values[i]; if (!Number.isFinite(v)) continue; if (v<min) min=v; if (v>max) max=v }
  if (!Number.isFinite(min) || !Number.isFinite(max) || min===max) return min||0
  const bins = new Float64Array(256)
  for (let i=0;i<n;i++){ const v=values[i]; const t = Math.max(0, Math.min(255, Math.floor(((v - min)/(max - min))*255))); bins[t]++ }
  const total = n
  let sum = 0
  for (let i=0;i<256;i++) sum += i*bins[i]
  let sumB = 0, wB = 0, varMax = 0, threshold = 0
  for (let i=0;i<256;i++){
    wB += bins[i]; if (wB===0) continue
    const wF = total - wB; if (wF===0) break
    sumB += i*bins[i]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const varBetween = wB * wF * (mB - mF) * (mB - mF)
    if (varBetween > varMax){ varMax = varBetween; threshold = i }
  }
  return min + (threshold/255)*(max - min)
}

// Point in polygon (ray casting)
function pointInPoly(px, py, pts){
  let inside=false
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const xi=pts[i].x, yi=pts[i].y, xj=pts[j].x, yj=pts[j].y
    const intersect = ((yi>py)!=(yj>py)) && (px < (xj-xi)*(py-yi)/(yj-yi+1e-9) + xi)
    if (intersect) inside=!inside
  }
  return inside
}

export default function IndicesAnalyzerPage(){
  const videoRef = useRef(null)
  const inRef = useRef(null)
  const outRef = useRef(null)
  const rafRef = useRef(null)
  const streamRef = useRef(null)

  const [useCamera, setUseCamera] = useState(false)
  const [paused, setPaused] = useState(false)
  const [indexType, setIndexType] = useState('ExG')
  const [status, setStatus] = useState('')
  const [fps, setFps] = useState(0)

  const [metrics, setMetrics] = useState({ mean:0, min:0, max:0, sharpness:0, frac:0, area_px:0, area_m2:null, threshold:null })
  const [location, setLocation] = useState(null)
  const [project, setProject] = useState('Agroforestry')
  const [method, setMethod] = useState('Baseline')
  const [note, setNote] = useState('')

  const [classType, setClassType] = useState('Vegetation')
  const [autoThresh, setAutoThresh] = useState(true)
  const [threshold, setThreshold] = useState(0)
  const [cmPerPixel, setCmPerPixel] = useState('')

  // ROI rectangle
  const [roiEnabled, setRoiEnabled] = useState(true)
  const [roi, setRoi] = useState(null)
  const [dragging, setDragging] = useState(false)

  // Polygon
  const [polyEnabled, setPolyEnabled] = useState(false)
  const [polyPoints, setPolyPoints] = useState([])

  // Scale measure
  const [scaleMode, setScaleMode] = useState(false)
  const [scalePoints, setScalePoints] = useState([])

  useEffect(()=>{
    return ()=>{ if (rafRef.current) cancelAnimationFrame(rafRef.current); if (streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop()) }
  }, [])

  async function startCamera(){
    try{
      setStatus('Requesting camera…')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setStatus('')
    }catch(e){ setStatus('Camera failed: '+(e.message||e)) }
  }
  useEffect(()=>{ if (!useCamera){ if (streamRef.current){ streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null } return } startCamera() }, [useCamera])

  function onFile(e){
    const f = e.target.files?.[0]; if (!f) return
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = ()=>{
      const c = inRef.current; const ctx = c.getContext('2d')
      c.width = img.width; c.height = img.height
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  function processFrame(){
    const c1 = inRef.current, c2 = outRef.current, v = videoRef.current
    if (!c1 || !c2) return
    const ctx1 = c1.getContext('2d'); const ctx2 = c2.getContext('2d')
    if (useCamera && v && v.videoWidth){
      c1.width = v.videoWidth; c1.height = v.videoHeight
      ctx1.drawImage(v, 0, 0, c1.width, c1.height)
    }
    const w = c1.width, h = c1.height
    if (!w || !h) return

    const inData = ctx1.getImageData(0,0,w,h)
    const { out, min, max } = computeIndex(inData.data, w, h, indexType)
    const outImg = normalizeToRGBA(out, w, h, min, max)

    // Threshold & mask
    const thr = autoThresh ? otsuThreshold(out) : threshold
    const mask = new Uint8Array(w*h)
    for (let i=0;i<w*h;i++){
      const idx = out[i] > thr ? 1 : 0
      // simple class selection: vegetation = idx, bare soil = inverse, water = 0 (placeholder heuristic)
      mask[i] = (classType==='Vegetation') ? idx : (classType==='Bare Soil' ? (idx?0:1) : 0)
    }

    // Area count (polygon > roi > full frame)
    let areaPixels = 0, totalPixels = w*h
    if (polyEnabled && polyPoints.length >= 3){
      // bounding box for speed
      let bx0=w, by0=h, bx1=0, by1=0
      for (const p of polyPoints){ if (p.x<bx0) bx0=p.x; if (p.x>bx1) bx1=p.x; if (p.y<by0) by0=p.y; if (p.y>by1) by1=p.y }
      const x0 = Math.max(0, Math.floor(bx0)), x1 = Math.min(w, Math.ceil(bx1))
      const y0 = Math.max(0, Math.floor(by0)), y1 = Math.min(h, Math.ceil(by1))
      totalPixels = 0
      for (let y=y0;y<y1;y++){
        for (let x=x0;x<x1;x++){
          if (pointInPoly(x,y,polyPoints)){
            totalPixels++
            areaPixels += mask[y*w+x] ? 1 : 0
          }
        }
      }
    } else if (roiEnabled && roi && roi.w>4 && roi.h>4){
      const x0 = Math.max(0, Math.floor(roi.x)), y0 = Math.max(0, Math.floor(roi.y))
      const x1 = Math.min(w, Math.floor(roi.x+roi.w)), y1 = Math.min(h, Math.floor(roi.y+roi.h))
      totalPixels = Math.max(0, (x1-x0)*(y1-y0))
      for (let y=y0;y<y1;y++){
        for (let x=x0;x<x1;x++){
          areaPixels += mask[y*w+x] ? 1 : 0
        }
      }
    } else {
      for (let i=0;i<w*h;i++) areaPixels += mask[i]
    }

    // Draw index
    c2.width = w; c2.height = h
    ctx2.putImageData(outImg, 0, 0)

    // Overlays: ROI, polygon, scale points
    ctx2.save()
    if (roiEnabled && roi && roi.w>4 && roi.h>4){
      ctx2.strokeStyle='#ffffff'; ctx2.lineWidth=2; ctx2.setLineDash([6,4]); ctx2.strokeRect(roi.x, roi.y, roi.w, roi.h)
    }
    if (polyPoints.length){
      ctx2.strokeStyle='#34d399'; ctx2.lineWidth=2; ctx2.setLineDash([])
      ctx2.beginPath(); ctx2.moveTo(polyPoints[0].x, polyPoints[0].y)
      for (let i=1;i<polyPoints.length;i++) ctx2.lineTo(polyPoints[i].x, polyPoints[i].y)
      ctx2.stroke()
      // draw vertices
      ctx2.fillStyle='#34d399'
      for (const p of polyPoints){ ctx2.beginPath(); ctx2.arc(p.x, p.y, 3, 0, Math.PI*2); ctx2.fill() }
    }
    if (scalePoints.length){
      ctx2.fillStyle='#00ffff'
      for (const p of scalePoints){ ctx2.beginPath(); ctx2.arc(p.x, p.y, 4, 0, Math.PI*2); ctx2.fill() }
      if (scalePoints.length===2){ ctx2.strokeStyle='#00ffff'; ctx2.beginPath(); ctx2.moveTo(scalePoints[0].x, scalePoints[0].y); ctx2.lineTo(scalePoints[1].x, scalePoints[1].y); ctx2.stroke() }
    }
    ctx2.restore()

    // Metrics
    let sum=0; for (let i=0;i<w*h;i++) sum += out[i]
    const mean = sum/(w*h)
    const sharp = varianceOfLaplacian(inData.data, w, h)
    const frac = totalPixels ? (areaPixels/totalPixels) : 0
    const gsd_m = (parseFloat(cmPerPixel||'')||0)/100.0
    const area_m2 = gsd_m>0 ? (areaPixels * gsd_m * gsd_m) : null
    setMetrics({ mean, min, max, sharpness: sharp, frac, area_px: areaPixels, area_m2, threshold: thr })

    // Next frame loop
    const t0 = performance.now()
    rafRef.current = requestAnimationFrame(()=>{
      const dt = performance.now() - t0
      setFps(1000/Math.max(1,dt))
      if (!paused) processFrame()
    })
  }

  useEffect(()=>{ if (!paused) processFrame(); return ()=>{ if (rafRef.current) cancelAnimationFrame(rafRef.current) } }, [useCamera, paused, indexType, autoThresh, threshold, cmPerPixel, roi, roiEnabled, polyPoints, polyEnabled, scalePoints])

  // Mouse events for ROI / Polygon / Scale
  useEffect(()=>{
    const c = outRef.current; if (!c) return
    function canvasToPx(e){
      const r=c.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top
      return { x: x*c.width/r.width, y: y*c.height/r.height }
    }
    let start = null
    function onDown(e){
      const pt = canvasToPx(e)
      if (scaleMode){
        setScalePoints(sp => {
          const next = [...sp, pt]
          if (next.length===2){
            const dx=next[1].x-next[0].x, dy=next[1].y-next[0].y
            const pixDist = Math.sqrt(dx*dx + dy*dy)
            const cm = parseFloat(prompt('Enter real distance (cm) between points:', '100')||'0')
            if (cm > 0 && pixDist > 0){
              const cmpp = cm / pixDist
              setCmPerPixel(String(cmpp.toFixed(4)))
              alert('Scale set: '+cmpp.toFixed(4)+' cm/pixel')
            }
            return []
          }
          return next
        })
        return
      }
      if (polyEnabled){
        setPolyPoints(arr => [...arr, pt])
        return
      }
      if (!roiEnabled) return
      start = pt
      setDragging(true)
      setRoi({x:pt.x, y:pt.y, w:0, h:0})
    }
    function onMove(e){
      if (!dragging || !roiEnabled || !start) return
      const pt = canvasToPx(e)
      setRoi({ x: Math.min(start.x, pt.x), y: Math.min(start.y, pt.y), w: Math.abs(pt.x - start.x), h: Math.abs(pt.y - start.y) })
    }
    function onUp(){ setDragging(false); start=null }
    c.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return ()=>{ c.removeEventListener('mousedown', onDown); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [roiEnabled, polyEnabled, scaleMode, dragging])

  return (
    <div style={{display:'grid', gap:16}}>
      <h3 className="agri-gradient-title" style={{margin:0}}>Real-time Image Analyzer</h3>

      <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
        <label><input type="checkbox" checked={useCamera} onChange={e=>setUseCamera(e.target.checked)} /> Use Camera</label>
        <select value={indexType} onChange={e=>setIndexType(e.target.value)} className="agri-pill" style={{padding:'6px 10px'}}>
          {['ExG','ExR','NGRDI','ExGR'].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        {!useCamera && <input type="file" accept="image/*" onChange={onFile} />}
        {useCamera && <button className="agri-pill" onClick={()=>setPaused(p=>!p)}>{paused?'Resume':'Pause'}</button>}
        <button className="agri-pill" onClick={()=>{const c=outRef.current; const a=document.createElement('a'); a.href=c.toDataURL('image/png'); a.download='index.png'; a.click()}}>Snapshot</button>
        <div className="agri-badge">FPS {fps.toFixed(0)}</div>
        <div className="agri-badge">Mean {metrics.mean.toFixed(3)}</div>
        <div className="agri-badge">Sharp {metrics.sharpness.toFixed(1)}</div>
        <div className="agri-badge">Frac {Number.isFinite(metrics.frac) ? (metrics.frac*100).toFixed(1) : '0.0'}%</div>
        {metrics.area_m2!=null && <div className="agri-badge">Area {metrics.area_m2.toFixed(2)} m²</div>}
      </div>

      <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
        <GeoCapture onChange={setLocation} />
        <select value={project} onChange={e=>setProject(e.target.value)} className="agri-pill" style={{padding:'6px 10px'}}>
          {['Agroforestry','Rice'].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <select value={method} onChange={e=>setMethod(e.target.value)} className="agri-pill" style={{padding:'6px 10px'}}>
          {(project==='Rice' ? ['AWD','Flooded','SRI','Baseline'] : ['Baseline','Alley Cropping','Windbreaks']).map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <select value={classType} onChange={e=>setClassType(e.target.value)} className="agri-pill" style={{padding:'6px 10px'}}>
          {['Vegetation','Water','Bare Soil'].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <label className="agri-pill" style={{display:'inline-flex', gap:6, alignItems:'center'}}>
          <input type="checkbox" checked={autoThresh} onChange={e=>setAutoThresh(e.target.checked)} /> Auto-threshold
        </label>
        {!autoThresh && <input type="range" min="-1" max="1" step="0.01" value={threshold} onChange={e=>setThreshold(parseFloat(e.target.value))} style={{width:140}} />}
        <input className="agri-pill" placeholder="Scale (cm/pixel)" value={cmPerPixel} onChange={e=>setCmPerPixel(e.target.value)} style={{padding:'6px 10px', width:160}}/>
        <button className="agri-pill" onClick={()=>{ setScaleMode(s=>!s); setScalePoints([]); }} title="Click two points, then enter real distance (cm)">{scaleMode ? 'Cancel Scale' : 'Measure Scale'}</button>
        <label className="agri-pill" style={{display:'inline-flex', gap:6, alignItems:'center'}}>
          <input type="checkbox" checked={roiEnabled} onChange={e=>setRoiEnabled(e.target.checked)} /> ROI
        </label>
        <button className="agri-pill" onClick={()=>setRoi(null)}>Reset ROI</button>
        <label className="agri-pill" style={{display:'inline-flex', gap:6, alignItems:'center'}}>
          <input type="checkbox" checked={polyEnabled} onChange={e=>{ setPolyEnabled(e.target.checked); if(!e.target.checked) setPolyPoints([]) }} /> Polygon
        </label>
        {polyEnabled && <button className="agri-pill" onClick={()=>setPolyPoints([])}>Clear Polygon</button>}
        <input className="agri-pill" placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)} style={{padding:'6px 10px', minWidth:200}}/>
        <button className="agri-pill" onClick={async()=>{
          try{
            const payload = { ts:new Date().toISOString(), project, method, indexType, classType, metrics, location, note }
            const res = await saveRecord(payload)
            alert('Saved record: '+res.id)
          }catch(e){ alert('Save failed: '+(e.message||e)) }
        }}>Save to MRV</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        <div>
          <h4>Input</h4>
          <video ref={videoRef} autoPlay playsInline muted style={{display: useCamera ? 'block' : 'none', width: '0px', height: '0px'}} />
          <canvas ref={inRef} style={{width:'100%', border:'1px solid #e5e7eb', background:'#fff'}}/>
        </div>
        <div>
          <h4>{indexType} (Live)</h4>
          <canvas ref={outRef} style={{width:'100%', border:'1px solid #e5e7eb', background:'#fff', cursor: (roiEnabled||polyEnabled||scaleMode)?'crosshair':'default'}}/>
          <div style={{height:10, background:'linear-gradient(90deg,red,yellow,green)', borderRadius:6, marginTop:6}}/>
        </div>
      </div>

      {status && <p style={{color:'#b91c1c'}}>{status}</p>}
      <p style={{marginTop:12, fontSize:13, opacity:0.8}}>
        Tip: Turn on <b>Polygon</b> to add boundary points on the index image (works with live camera). Use <b>Measure Scale</b> to get accurate m².
      </p>
    </div>
  )
}
