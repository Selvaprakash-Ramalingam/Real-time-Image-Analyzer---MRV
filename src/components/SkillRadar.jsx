import React from 'react'
import { Radar } from 'react-chartjs-2'
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'
Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export default function SkillRadar({ you=[60, 50, 70, 40, 30, 65], target=[80, 70, 80, 50, 40, 75] }) {
  const labels = ['GIS','Remote Sensing','Programming','Soil','Business','Statistics']
  const data = {
    labels,
    datasets: [{
      label: 'You',
      data: you,
    },{
      label: 'Target Role',
      data: target,
    }]
  }
  const options = { responsive: true, plugins: { legend: { position: 'top' } } }
  return <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:8}}><Radar data={data} options={options}/></div>
}
