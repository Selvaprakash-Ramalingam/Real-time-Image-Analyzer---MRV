import React from 'react'
import ToolsGrid from '../components/ToolsGrid.jsx'

export default function Home(){
  return (
    <div>
      <section style={{marginBottom:12}}>
        <h3>Welcome</h3>
        <p>Discover agriculture careers, analyze your skill gaps, simulate day-in-life roles, and explore precision farming tools.</p>
      </section>
      <ToolsGrid/>
    </div>
  )
}
