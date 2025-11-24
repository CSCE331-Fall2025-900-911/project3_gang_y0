'use client';

import { useEffect, useState } from 'react';

interface InventoryItem {
  id: number;
  item: string;
  vendor: string;
  unit_price: number;
  quantity: number;
}

export default function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ item: '', vendor: '', unit_price: 0, quantity: 0 });

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const res = await fetch('/api/inventory');
    const data = await res.json();
    setItems(data.items || []);
  }

  async function save() {
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/inventory?id=${editing.id}` : '/api/inventory';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ item: '', vendor: '', unit_price: 0, quantity: 0 });
    setEditing(null);
    fetchItems();
  }

  async function remove(id: number) {
    if (!confirm('Delete inventory item?')) return;
    await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
    fetchItems();
  }

  function edit(item: InventoryItem) {
    setEditing(item);
    setForm({
      item: item.item,
      vendor: item.vendor,
      unit_price: item.unit_price,
      quantity: item.quantity,
    });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-blue-800 mb-4">Inventory Items</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <table className="w-full text-left border border-gray-200 rounded">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Vendor</th>
                <th className="p-2">Unit Price</th>
                <th className="p-2">Quantity</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{it.id}</td>
                  <td className="p-2">{it.item}</td>
                  <td className="p-2">{it.vendor}</td>
                  <td className="p-2">${it.unit_price.toFixed(2)}</td>
                  <td className="p-2">{it.quantity}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => edit(it)}
                      className="px-2 py-1 text-sm border rounded bg-yellow-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      className="px-2 py-1 text-sm border rounded bg-red-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border border-gray-200 rounded">
          <h3 className="font-medium text-blue-700 mb-2">{editing ? 'Edit' : 'Add'} Inventory Item</h3>
          <label className="block mb-2">
            <div className="text-sm text-gray-700">Name</div>
            <input
              className="w-full p-2 border rounded"
              value={form.item}
              onChange={e => setForm({ ...form, item: e.target.value })}
            />
          </label>
          <label className="block mb-2">
            <div className="text-sm text-gray-700">Vendor</div>
            <input
              className="w-full p-2 border rounded"
              value={form.vendor}
              onChange={e => setForm({ ...form, vendor: e.target.value })}
            />
          </label>
          <label className="block mb-2">
            <div className="text-sm text-gray-700">Unit Price</div>
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border rounded"
              value={form.unit_price}
              onChange={e => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
            />
          </label>
          <label className="block mb-4">
            <div className="text-sm text-gray-700">Quantity</div>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {editing ? 'Update' : 'Create'}
            </button>
            {editing && (
              <button
                onClick={() => {
                  setEditing(null);
                  setForm({ item: '', vendor: '', unit_price: 0, quantity: 0 });
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
