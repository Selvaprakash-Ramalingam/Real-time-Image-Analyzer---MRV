import React from 'react'

export default function Footer(){
  return (
    <footer style={{marginTop:24, padding:'16px 12px', background:'#0a472a', color:'#e8ffee',
                    display:'flex', alignItems:'center', gap:16, flexWrap:'wrap'}}>
      <div style={{marginRight:'auto'}}>© {new Date().getFullYear()} AgriSkill Navigator — All Rights Reserved.</div>
      <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" style={aS}>LinkedIn</a>
      <a href="https://www.instagram.com" target="_blank" rel="noreferrer" style={aS}>Instagram</a>
      <a href="mailto:agriskill.navigator@gmail.com" style={aS}>Gmail</a>
    </footer>
  )
}

const aS = { color:'#e8ffee', textDecoration:'none', fontWeight:600 }
