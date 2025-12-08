'use client';

import { useEffect, useState } from 'react';
import { CATEGORIES } from '../../constants';

interface MenuItem {
  id: number;
  item: string;
  price: number;
  category: string;
  inventory_item_ids: number[];
}

interface InventoryItem {
  id: number;
  item: string;
}

export default function MenuTab() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<Omit<MenuItem, 'id'>>({
    item: '',
    price: 0,
    category: CATEGORIES[0],
    inventory_item_ids: []
  });

  useEffect(() => {
    fetchMenu();
    fetchInventory();
  }, []);

  async function fetchMenu() {
  try {
    const res = await fetch('/api/menu');
    if (!res.ok) return setMenuItems([]);
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    setMenuItems(data.items ?? []);
  } catch {
    setMenuItems([]);
  }
}

async function fetchInventory() {
  try {
    const res = await fetch('/api/inventory');
    if (!res.ok) return setInventoryItems([]);
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];
    setInventoryItems(data ?? []);
  } catch {
    setInventoryItems([]);
  }
}


  function toggleInventory(id: number) {
    setForm(prev => {
      const exists = prev.inventory_item_ids.includes(id);
      return {
        ...prev,
        inventory_item_ids: exists
          ? prev.inventory_item_ids.filter(i => i !== id)
          : [...prev.inventory_item_ids, id]
      };
    });
  }

  async function save() {
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/menu?id=${editing.id}` : '/api/menu';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm({ item: '', price: 0, category: CATEGORIES[0], inventory_item_ids: [] });
    setEditing(null);
    fetchMenu();
  }

  async function remove(id: number) {
    await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
    fetchMenu();
  }

  function edit(item: MenuItem) {
    setEditing(item);
    setForm({
      item: item.item,
      price: item.price,
      category: item.category,
      inventory_item_ids: item.inventory_item_ids || []
    });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-blue-800 mb-4">Menu Items</h2>

      <div className="grid grid-cols-2 gap-6 text-black">
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
              {menuItems.map(item => (
                <tr key={item.id} className="border-t text-black">
                  <td className="p-2">{item.item}</td>
                  <td className="p-2">${item.price.toFixed(2)}</td>
                  <td className="p-2">{item.category}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => edit(item)} className="px-2 py-1 text-sm border rounded">Edit</button>
                    <button onClick={() => remove(item.id)} className="px-2 py-1 text-sm border rounded text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border border-gray-200 rounded">
          <h3 className="font-medium text-blue-700 mb-2">{editing ? 'Edit' : 'Add'} Menu Item</h3>

          <label className="block mb-2">
            <div className="text-sm text-gray-700">Name</div>
            <input
              className="w-full p-2 border rounded"
              value={form.item}
              onChange={e => setForm({ ...form, item: e.target.value })}
            />
          </label>

          <label className="block mb-2">
            <div className="text-sm text-gray-700">Price</div>
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border rounded"
              value={form.price}
              onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />
          </label>

          <label className="block mb-4">
            <div className="text-sm text-gray-700">Category</div>
            <select
              className="w-full p-2 border rounded"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <div className="mb-4">
            <div className="text-sm text-gray-700 mb-1">Inventory Items</div>
            <div className="flex flex-col max-h-48 overflow-y-auto border p-2 rounded">
              {inventoryItems.map(inv => (
                <label key={inv.id} className="inline-flex items-center mb-1">
                  <input
                    type="checkbox"
                    checked={form.inventory_item_ids.includes(inv.id)}
                    onChange={() => toggleInventory(inv.id)}
                    className="mr-2"
                  />
                  {inv.item}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">{editing ? 'Update' : 'Create'}</button>
            {editing && (
              <button onClick={() => { setEditing(null); setForm({ item: '', price: 0, category: CATEGORIES[0], inventory_item_ids: [] }); }} className="px-4 py-2 border rounded">Cancel</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
