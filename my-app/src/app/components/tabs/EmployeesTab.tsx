'use client';

import { useEffect, useState } from 'react';

interface Employee {
  id: number;
  name: string;
  email: string;
  position: 'manager' | 'cashier';
}

const POSITIONS: Employee['position'][] = ['manager', 'cashier'];

export default function EmployeesTab() {
  const [items, setItems] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: '', email: '', position: 'cashier' as Employee['position'] });

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const res = await fetch('/api/employees');
    const data = await res.json();
    setItems(data);
  }

  async function save() {
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/employees?id=${editing.id}` : '/api/employees';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm({ name: '', email: '', position: 'cashier' });
    setEditing(null);
    fetchItems();
  }

  async function remove(id: number) {
    if (!confirm('Delete employee?')) return;
    await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
    fetchItems();
  }

  function edit(item: Employee) {
    setEditing(item);
    setForm({ name: item.name, email: item.email, position: item.position });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-blue-800 mb-4">Employees</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* Table */}
        <div>
          <table className="w-full text-left border border-gray-200 rounded text-black">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Position</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{it.id}</td>
                  <td className="p-2">{it.name}</td>
                  <td className="p-2">{it.email}</td>
                  <td className="p-2">{it.position.charAt(0).toUpperCase() + it.position.slice(1)}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => edit(it)} className="px-2 py-1 text-sm border rounded">Edit</button>
                    <button onClick={() => remove(it.id)} className="px-2 py-1 text-sm border rounded text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form */}
        <div className="p-4 border border-gray-200 rounded">
          <h3 className="font-medium text-blue-700 mb-2">{editing ? 'Edit' : 'Add'} Employee</h3>

          <label className="block mb-2">
            <div className="text-sm text-gray-700">Name</div>
            <input
              className="w-full p-2 border rounded text-gray-700"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label className="block mb-2">
            <div className="text-sm text-gray-700">Email</div>
            <input
              className="w-full p-2 border rounded text-gray-700"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <label className="block mb-4">
            <div className="text-sm text-gray-700 text-gray-700">Position</div>
            <select
              className="w-full p-2 border rounded"
              value={form.position.charAt(0).toUpperCase() + form.position.slice(1)}
              onChange={e => setForm({ ...form, position: e.target.value.toLowerCase() as Employee['position'] })}
            >
              {POSITIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </label>

          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">{editing ? 'Update' : 'Create'}</button>
            {editing && <button onClick={() => { setEditing(null); setForm({ name: '', email: '', position: 'cashier' }); }} className="px-4 py-2 border rounded">Cancel</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
