
// CSV loader for ICAR staff (new schema).
// CSV headers:
// Category,institute,Department_or_Division,Staff_name,designation,email,campus_or_unit,city,state,source_url,as_of_date,data_status
export async function loadICARStaffCSV(path = '/icar_all_staff.csv') {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) return [];
    const text = await res.text();
    return parseCSV(text);
  } catch (e) {
    console.warn('ICAR staff CSV load failed:', e);
    return [];
  }
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCSVLine(lines[0]);
  const idx = {};
  headers.forEach((h,i)=> idx[h.trim()] = i);
  const get = (row, key) => {
    const i = idx[key]; return (i != null && row[i] != null) ? String(row[i]).trim() : '';
  };
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVLine(lines[i]); if (!row || !row.length) continue;
    out.push({
      category: get(row,'Category'),
      institute: get(row,'institute'),
      name: get(row,'Staff_name'),
      dept: get(row,'Department_or_Division'),
      email: get(row,'email'),
      designation: get(row,'designation'),
      campus: get(row,'campus_or_unit'),
      city: get(row,'city'),
      state: get(row,'state'),
      source_url: get(row,'source_url'),
      as_of_date: get(row,'as_of_date'),
      data_status: get(row,'data_status'),
      tags: (get(row,'designation') || '').split('|').map(s=>s.trim()).filter(Boolean)
    });
  }
  return out;
}

function splitCSVLine(line){
  const out = []; let cur=''; let inQ=false;
  for (let i=0;i<line.length;i++){
    const ch=line[i];
    if (ch==='"'){ if(inQ && line[i+1]==='"'){cur+='"';i++;} else {inQ=!inQ} }
    else if (ch===',' && !inQ){ out.push(cur); cur=''; }
    else { cur+=ch; }
  }
  out.push(cur); return out;
}

export function mergeStaffIntoCatalog(baseCatalog, rows) {
  const catalog = JSON.parse(JSON.stringify(baseCatalog || {}));
  for (const r of rows) {
    const cat = r.category || 'Uncategorized';
    catalog[cat] = catalog[cat] || {};
    catalog[cat][r.institute] = catalog[cat][r.institute] || [];
    catalog[cat][r.institute].push({
      name: r.name, dept: r.dept, email: r.email, designation: r.designation,
      campus: r.campus, city: r.city, state: r.state, source_url: r.source_url,
      as_of_date: r.as_of_date, data_status: r.data_status, tags: r.tags || []
    });
  }
  return catalog;
}
