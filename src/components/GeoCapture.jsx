import React, { useState } from 'react'

export default function GeoCapture({ onChange }){
  const [loc, setLoc] = useState({lat:null, lon:null, acc:null, ts:null})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function getLocation(){
    setLoading(true); setError('')
    if (!('geolocation' in navigator)){
      setError('Geolocation not supported'); setLoading(false); return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords
        const ts = new Date(pos.timestamp).toISOString()
        const next = {lat: latitude, lon: longitude, acc: accuracy, ts}
        setLoc(next)
        onChange?.(next)
        setLoading(false)
      },
      err => { setError(err.message || 'Failed'); setLoading(false) },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    )
  }

  return (
    <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
      <button className="agri-pill" onClick={getLocation} disabled={loading}>
        {loading? 'Locating…':'Capture Location'}
      </button>
      {loc.lat && <div style={{fontSize:12, opacity:.8}}>lat {loc.lat.toFixed(6)}, lon {loc.lon.toFixed(6)} ±{Math.round(loc.acc||0)}m</div>}
      {error && <div style={{color:'#b91c1c', fontSize:12}}>{error}</div>}
    </div>
  )
}
