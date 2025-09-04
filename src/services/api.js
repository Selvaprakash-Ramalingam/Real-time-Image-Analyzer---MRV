export async function saveRecord(payload) {
  const res = await fetch(import.meta.env.VITE_API_URL ?? "http://localhost:8000/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to save record");
  return await res.json();
}

export async function fetchRecords() {
  const res = await fetch(import.meta.env.VITE_API_URL ?? "http://localhost:8000/records");
  if (!res.ok) throw new Error("Failed to fetch records");
  const data = await res.json();
  return data.items ?? [];
}
