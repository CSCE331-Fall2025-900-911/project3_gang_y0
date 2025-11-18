'use client';

import { useEffect, useState } from 'react';

type ReportTab = 'x' | 'z' | 'usage' | 'sales';

export default function ReportsTab() {
  const [active, setActive] = useState<ReportTab>('x');
  const [data, setData] = useState<any>(null);

  useEffect(() => { fetchReport(active); }, [active]);

  async function fetchReport(type: ReportTab) {
    let url = '';
    if (type === 'x') url = '/api/reports/x';
    if (type === 'z') url = '/api/reports/z';
    if (type === 'usage') url = '/api/reports/usage?from=2025-11-01T00:00:00Z&to=2025-11-17T23:59:59Z';
    if (type === 'sales') url = '/api/reports/sales?from=2025-11-01T00:00:00Z&to=2025-11-17T23:59:59Z';
    const method = type === 'z' ? 'POST' : 'GET';
    const res = await fetch(url, { method });
    setData(await res.json());
  }

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'x', label: 'X-Report' },
    { id: 'z', label: 'Z-Report' },
    { id: 'usage', label: 'Product Usage' },
    { id: 'sales', label: 'Sales Report' },
  ];

  return (
    <div>
      <nav className="flex gap-2 border-b pb-4 mb-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} className={`px-3 py-2 rounded-t-lg font-medium ${active===t.id ? 'bg-blue-600 text-white shadow-md':'bg-white text-blue-800 border border-gray-200'}`}>{t.label}</button>
        ))}
      </nav>
      <pre className="p-4 border border-gray-200 rounded max-h-[400px] overflow-auto bg-gray-50">{JSON.stringify(data,null,2)}</pre>
    </div>
  );
}
