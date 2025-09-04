import React from 'react'
import { Link } from 'react-router-dom'

export default function Header({ onNavigate }){
  return (
    <header style={{display:'flex', alignItems:'center', gap:16, padding:'10px 16px',
                    position:'sticky', top:0, zIndex:10, background:'linear-gradient(90deg,#0a4,#0a6)',
                    color:'#fff', borderBottom:'1px solid rgba(255,255,255,0.2)'}}>
      <h2 style={{marginRight:'auto'}}><Link to="/" style={{color:'#fff', textDecoration:'none'}}>🌾 AgriSkill Navigator</Link></h2>
      <nav style={{display:'flex', gap:16}}>
        <Link to="/" style={linkS}>Home</Link>
        <Link to="/agriskill" style={linkS}>AgriSkill</Link>
        <Link to="/indices" style={linkS}>Indices</Link>
        <Link to="/genai" style={linkS}>GenAI</Link>
        <a href="#" style={linkS}>Resources</a>
        <a href="#" style={linkS}>Contacts</a>
      </nav>
    </header>
  )
}

const linkS = { cursor:'pointer', color:'#fff', textDecoration:'none', fontWeight:600 }
