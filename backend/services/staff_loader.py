
import csv, os
from typing import List, Dict

CSV_PATH = os.environ.get('ICAR_STAFF_CSV', os.path.join(os.path.dirname(__file__), '..', 'data', 'icar_all_staff.csv'))

def load_staff() -> List[Dict]:
    path = os.path.abspath(os.path.normpath(CSV_PATH))
    rows: List[Dict] = []
    if not os.path.exists(path):
        return rows
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append({
                'category': r.get('Category',''),
                'institute': r.get('institute',''),
                'dept': r.get('Department_or_Division',''),
                'name': r.get('Staff_name',''),
                'designation': r.get('designation',''),
                'email': r.get('email',''),
                'campus': r.get('campus_or_unit',''),
                'city': r.get('city',''),
                'state': r.get('state',''),
                'source_url': r.get('source_url',''),
                'as_of_date': r.get('as_of_date',''),
                'data_status': r.get('data_status',''),
            })
    return rows
