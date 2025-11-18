'use client';

import { useEffect, useState } from 'react';

interface Employee {
  id: number;
  name: string;
  role: string;
}

export default function EmployeesTab() {
  const [items, setItems] = useState<Employee[]>([]);
  const [form, setForm] = useState({ name: '', role: '' });

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const res = await fetch('/api/employees');
    setItems(await res.json());
  }

  async function save() {
    await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ name: '', role: '' });
    fetchItems();
  }

  async function remove(id: number) {
    if (!confirm('Delete employee?')) return;
    await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
    fetchItems();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-blue-800 mb-4">Employees</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <table className="w-full text-left border border-gray-200 rounded">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Role</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{it.name}</td>
                  <td className="p-2">{it.role}</td>
                  <td className="p-2"><button onClick={() => remove(it.id)} className="px-2 py-1 text-sm border rounded">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border border-gray-200 rounded">
          <h3 className="font-medium text-blue-700 mb-2">Add Employee</h3>
          <label className="block mb-2"><div className="text-sm text-gray-700">Name</div><input className="w-full p-2 border rounded" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block mb-4"><div className="text-sm text-gray-700">Role</div><input className="w-full p-2 border rounded" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></label>
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
        </div>
      </div>
    </div>
  );
}
