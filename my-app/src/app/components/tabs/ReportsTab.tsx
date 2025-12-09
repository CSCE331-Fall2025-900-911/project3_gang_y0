'use client';

import { useEffect, useState } from 'react';

type ReportTab = 'x' | 'z' | 'usage' | 'sales';

function localISODate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function ReportsTab() {
  const [active, setActive] = useState<ReportTab>('x');
  const [data, setData] = useState<any>(null);

  const [from, setFrom] = useState<string>(localISODate);
  const [to, setTo] = useState<string>(localISODate);

  // Clear previous data instantly on tab switch
  useEffect(() => {
    setData("loading...");
  }, [active]);

  // Trigger fetch reliably
  useEffect(() => {
    if (active === 'z') return;

    if ((active === 'sales' || active === 'usage') && (!from || !to)) return;

    fetchReport(active);
  }, [active, from, to]);

  async function fetchReport(type: ReportTab) {
    setData("loading...");

    let url = '';
    if (type === 'x') url = '/api/reports/x';

    const fromTs = `${from}T00:00:00`;
    const toTs = `${to}T23:59:59`;

    if (type === 'usage') url = `/api/reports/usage?from=${fromTs}&to=${toTs}`;
    if (type === 'sales') url = `/api/reports/sales?from=${fromTs}&to=${toTs}`;

    const res = await fetch(url);
    const json = await res.json();

    if (type === 'x' && (!json || json.length === 0)) {
      setData({ message: 'No transactions for current day' });
    } else {
      setData(json);
    }
  }

  async function runZReport() {
    setData("loading...");
    const res = await fetch('/api/reports/z', { method: 'POST' });
    const json = await res.json();
    setData(
      json.length === 0
        ? { message: 'Z-Report completed: all transactions deleted for current day' }
        : json
    );
  }

  const tabs = [
    { id: 'x', label: 'X-Report' },
    { id: 'z', label: 'Z-Report' },
    { id: 'usage', label: 'Product Usage' },
    { id: 'sales', label: 'Sales Report' },
  ] as const;

  return (
    <div>
      <nav className="flex gap-2 border-b pb-4 mb-4">
        {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setData("loading..."); 
                setActive(t.id);
              }}
              className={`px-3 py-2 rounded-t-lg font-medium ${
                active === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-800 border border-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
      </nav>

      {(active === 'sales' || active === 'usage') && (
        <div className="flex gap-2 mb-4 items-center">
          <label>
            From:{' '}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border p-1 rounded"
            />
          </label>
          <label>
            To:{' '}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border p-1 rounded"
            />
          </label>

          <button
            onClick={() => fetchReport(active)}
            className="px-3 py-2 bg-blue-600 text-white rounded shadow"
          >
            Refresh
          </button>
        </div>
      )}

      {active === 'z' && (
        <div className="mb-4">
          <button onClick={runZReport} className="px-4 py-2 bg-red-600 text-white rounded shadow">
            Run Z-Report
          </button>
        </div>
      )}

      <pre className="p-4 border border-gray-200 text-black rounded max-h-[400px] overflow-auto bg-gray-50">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
