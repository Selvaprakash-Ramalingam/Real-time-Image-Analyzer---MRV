import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as d3 from 'd3'

function Sparkline({ values=[10,20,14,28,22,35,30], width=180, height=56 }){
  const ref = useRef(null)
  useEffect(()=>{
    const el = ref.current
    el.innerHTML=''
    const svg = d3.select(el).append('svg').attr('width', width).attr('height', height)
    const x = d3.scaleLinear().domain([0, values.length-1]).range([6, width-6])
    const y = d3.scaleLinear().domain([0, d3.max(values)||1]).range([height-6, 6])
    const line = d3.line().x((d,i)=>x(i)).y(d=>y(d)).curve(d3.curveCatmullRom.alpha(0.6))
    const area = d3.area().x((d,i)=>x(i)).y0(height-6).y1(d=>y(d)).curve(d3.curveCatmullRom.alpha(0.6))
    svg.append('path').attr('d', area(values)).attr('fill','#16a34a22')
    svg.append('path').attr('d', line(values)).attr('fill','none').attr('stroke','#16a34a').attr('stroke-width',2)
  }, [values, width, height])
  return <div ref={ref}/>
}

function Gauge({ value=72, width=80, height=80 }){
  const ref = useRef(null)
  useEffect(()=>{
    const el = ref.current; el.innerHTML=''
    const r = Math.min(width,height)/2 - 6
    const svg = d3.select(el).append('svg').attr('width', width).attr('height', height)
      .append('g').attr('transform', `translate(${width/2},${height/2})`)
    const arc = d3.arc().innerRadius(r-8).outerRadius(r).startAngle(-Math.PI/2)
    const fg = svg.append('path').datum({endAngle: -Math.PI/2}).attr('d', arc).attr('fill','#10b981')
    fg.transition().duration(900).attrTween('d', function(d){
      const i = d3.interpolate(d.endAngle, (-Math.PI/2)+(Math.PI*value/100))
      return function(t){ d.endAngle = i(t); return arc(d) }
    })
    svg.append('text').text(value + '%').attr('dy','0.35em').attr('text-anchor','middle').style('fontWeight',700)
  }, [value, width, height])
  return <div ref={ref}/>
}

export default function ToolsGrid(){
  const cards = [
    {title:'AgriSkill Navigator', desc:'Explore careers, skills & mentors.', gauge:84, spark:[12,18,22,19,25,34,40], to:'/agriskill', cta:'Open'},
    {title:'Real-time Image-based Indices Analyzer', desc:'Compute VARI/GLI from RGB images.', gauge:67, spark:[8,12,5,18,22,30,27], to:'/indices', cta:'Try Analyzer'},
    {title:'GenAI for Precision Farming', desc:'Advisory for irrigation/fertilization/pests.', gauge:73, spark:[5,9,15,24,28,35,45], to:'/genai', cta:'Chat GenAI'}
  ]
  return (
    <section style={{marginTop:24}}>
      <h3>🧰 Tools</h3>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16}}>
        {cards.map((c,idx)=>(
          <div key={idx} style={cardS}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h4 style={{margin:0}}>{c.title}</h4>
              <Gauge value={c.gauge}/>
            </div>
            <p style={{opacity:0.85, marginTop:8}}>{c.desc}</p>
            <Sparkline values={c.spark}/>
            <div style={{display:'flex', justifyContent:'flex-end'}}>
              <Link to={c.to} style={btnS}>{c.cta}</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const cardS = {
  padding:12, borderRadius:12, border:'1px solid #e5e7eb',
  background:'linear-gradient(180deg, #ffffff, #f8fff9)',
  boxShadow:'0 8px 20px rgba(16,185,129,0.10)'
}
const btnS = { padding:'8px 12px', background:'#10b981', color:'#fff', borderRadius:8, textDecoration:'none', fontWeight:700 }
