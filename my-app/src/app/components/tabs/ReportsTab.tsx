'use client';

import { useEffect, useState } from 'react';

type ReportTab = 'x' | 'z' | 'usage' | 'sales';

export default function ReportsTab() {
  const [active, setActive] = useState<ReportTab>('x');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (active !== 'z') fetchReport(active);
  }, [active]);

  async function fetchReport(type: ReportTab) {
    let url = '';
    if (type === 'x') url = '/api/reports/x';
    if (type === 'usage') url = '/api/reports/usage?from=2025-11-01T00:00:00Z&to=2025-11-17T23:59:59Z';
    if (type === 'sales') url = '/api/reports/sales?from=2025-11-01T00:00:00Z&to=2025-11-17T23:59:59Z';

    const res = await fetch(url);
    const json = await res.json();

    if (type === 'x' && (!json || json.length === 0)) {
      setData({ message: 'No transactions for current day' });
    } else {
      setData(json);
    }
  }

  async function runZReport() {
    const res = await fetch('/api/reports/z', { method: 'POST' });
    const json = await res.json();

    if (!json || json.length === 0) {
      setData({ message: 'Z-Report completed: all transactions deleted for current day' });
    } else {
      setData(json);
    }
  }

  const tabs = [
    { id: 'x', label: 'X-Report' },
    { id: 'z', label: 'Z-Report' },
    { id: 'usage', label: 'Product Usage' },
    { id: 'sales', label: 'Sales Report' }
  ] as const;

  return (
    <div>
      <nav className="flex gap-2 border-b pb-4 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-3 py-2 rounded-t-lg font-medium ${
              active === t.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-blue-800 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {active === 'z' && (
        <div className="mb-4">
          <button
            onClick={runZReport}
            className="px-4 py-2 bg-red-600 text-white rounded shadow"
          >
            Run Z-Report
          </button>
        </div>
      )}

      <pre className="p-4 border border-gray-200 rounded max-h-[400px] overflow-auto bg-gray-50">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
