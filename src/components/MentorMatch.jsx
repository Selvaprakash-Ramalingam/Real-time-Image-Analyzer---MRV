import React from 'react'

export default function MentorMatch({ mentors=[] }){
  return (
    <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:12}}>
      <h4>Suggested Mentors</h4>
      <ul>
        {(mentors.length?mentors:[
          {name:'Anita (ICAR)', tags:['Soil Science','Climate']},
          {name:'Ravi (AgriTech Co.)', tags:['Drones','Computer Vision']},
          {name:'Fatima (NGO)', tags:['Agri-Business','Rural Dev']},
        ]).map((m,i)=> <li key={i}>{m.name} — <i>{m.tags.join(', ')}</i></li>)}
      </ul>
    </div>
  )
}
