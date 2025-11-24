'use client';

import { useState } from 'react';
import MenuTab from './tabs/MenuTab';
import InventoryTab from './tabs/InventoryTab';
import EmployeesTab from './tabs/EmployeesTab';
import ReportsTab from './tabs/ReportsTab';

const tabs = [
  { id: 'menu', label: 'Menu' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'employees', label: 'Employees' },
  { id: 'reports', label: 'Reports' },
] as const;

export default function ManagerTabs() {
  const [active, setActive] = useState<string>('menu');

  return (
    <div>
      <nav className="flex gap-2 border-b pb-4 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-2 rounded-t-xl font-medium ${
              active === t.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-blue-800 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div>
        {active === 'menu' && <MenuTab />}
        {active === 'inventory' && <InventoryTab />}
        {active === 'employees' && <EmployeesTab />}
        {active === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
}
