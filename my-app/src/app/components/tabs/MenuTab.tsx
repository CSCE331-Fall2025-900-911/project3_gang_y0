'use client';

import { useEffect, useState } from 'react';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  inventory_item_id: number | null;
  inventory_name?: string | null;
}

export default function MenuTab() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name: '', price: 0, inventory_item_id: null as number | null });

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const res = await fetch('/api/menu');
    setItems(await res.json());
  }

  async function save() {
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/menu?id=${editing.id}` : '/api/menu';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ name: '', price: 0, inventory_item_id: null });
    setEditing(null);
    fetchItems();
  }

  function edit(item: MenuItem) {
    setEditing(item);
    setForm({ name: item.name, price: item.price, inventory_item_id: item.inventory_item_id });
  }

  async function remove(id: number) {
    if (!confirm('Delete menu item?')) return;
    await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
    fetchItems();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-blue-800 mb-4">Menu Items</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <table className="w-full text-left border border-gray-200 rounded">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Price</th>
                <th className="p-2">Inventory Item</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
                <tbody>
                {[
                    { id: 1, name: 'Burger', price: 5.99 },
                    { id: 2, name: 'Fries', price: 2.99 },
                    { id: 3, name: 'Soda', price: 1.5 }
                ].map((it) => (
                    <tr key={it.id} className="border-t">
                    <td className="p-2">{it.name}</td>
                    <td className="p-2">${it.price.toFixed(2)}</td>
                    </tr>
                ))}
                </tbody>

          </table>
        </div>
        <div className="p-4 border border-gray-200 rounded">
          <h3 className="font-medium text-blue-700 mb-2">{editing ? 'Edit' : 'Add'} Menu Item</h3>
          <label className="block mb-2">
            <div className="text-sm text-gray-700">Name</div>
            <input className="w-full p-2 border rounded" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block mb-2">
            <div className="text-sm text-gray-700">Price</div>
            <input type="number" className="w-full p-2 border rounded" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} />
          </label>
          <label className="block mb-4">
            <div className="text-sm text-gray-700">Inventory Item ID</div>
            <input className="w-full p-2 border rounded" value={form.inventory_item_id ?? ''} onChange={(e) => setForm({ ...form, inventory_item_id: e.target.value ? Number(e.target.value) : null })} />
          </label>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">{editing ? 'Update' : 'Create'}</button>
            {editing && <button onClick={() => { setEditing(null); setForm({ name: '', price: 0, inventory_item_id: null }); }} className="px-4 py-2 border rounded">Cancel</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
