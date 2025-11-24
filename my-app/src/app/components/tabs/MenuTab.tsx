'use client';

import { useEffect, useState } from 'react';
import { CATEGORIES } from '../../constants';

interface InventoryItem {
  id: number;
  item: string;
}

interface MenuItem {
  id: number;
  item: string;
  price: number;
  category: string;
  inventory_item_ids: number[];
}

export default function MenuTab() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItem>({
    id: 0,
    item: '',
    price: 0,
    category: CATEGORIES[0],
    inventory_item_ids: [],
  });

  useEffect(() => {
    fetchMenu();
    fetchInventory();
  }, []);

  async function fetchMenu() {
    const res = await fetch('/api/menu');
    const data = await res.json();
    setItems(data.items);
  }

  async function fetchInventory() {
    const res = await fetch('/api/inventory');
    const data = await res.json();
    setInventory(data.items || []);
  }

  function startEdit(item: MenuItem) {
    setEditing(item);
    setForm({ ...item });
  }

  function resetForm() {
    setEditing(null);
    setForm({ id: 0, item: '', price: 0, category: CATEGORIES[0], inventory_item_ids: [] });
  }

  async function save() {
    const url = editing ? `/api/menu?id=${editing.id}` : '/api/menu';
    const method = editing ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    resetForm();
    fetchMenu();
  }

  async function remove(id: number) {
    if (!confirm('Delete menu item?')) return;
    await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
    fetchMenu();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-blue-800 mb-4">Menu Items</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* Menu Table */}
        <div>
          <table className="w-full text-left border border-gray-200 rounded">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Price</th>
                <th className="p-2">Category</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{it.item}</td>
                  <td className="p-2">${it.price.toFixed(2)}</td>
                  <td className="p-2">{it.category}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => startEdit(it)} className="px-2 py-1 bg-yellow-400 rounded">Edit</button>
                    <button onClick={() => remove(it.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Form */}
        <div className="p-4 border border-gray-200 rounded">
          <h3 className="font-medium text-blue-700 mb-2">{editing ? 'Edit' : 'Add'} Menu Item</h3>

          <label className="block mb-2">
            <div className="text-sm text-gray-700">Name</div>
            <input
              className="w-full p-2 border rounded"
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
            />
          </label>

          <label className="block mb-2">
            <div className="text-sm text-gray-700">Price</div>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={form.price || 0}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
            />
          </label>

          <label className="block mb-2">
            <div className="text-sm text-gray-700">Category</div>
            <select
              className="w-full p-2 border rounded"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <label className="block mb-4">
            <div className="text-sm text-gray-700">Inventory Items Used</div>
            <div className="border p-2 rounded h-40 overflow-auto">
              {inventory.map((inv) => (
                <label key={inv.id} className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={form.inventory_item_ids.includes(inv.id)}
                    onChange={(e) => {
                      const newIds = e.target.checked
                        ? [...form.inventory_item_ids, inv.id]
                        : form.inventory_item_ids.filter((id) => id !== inv.id);
                      setForm({ ...form, inventory_item_ids: newIds });
                    }}
                  />
                  {inv.item}
                </label>
              ))}
            </div>
          </label>

          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">
              {editing ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
