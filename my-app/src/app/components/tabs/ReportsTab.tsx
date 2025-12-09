// src/app/components/tabs/ReportsTab.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';

type ReportTab = 'x' | 'z' | 'usage' | 'sales';

function localISODate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function ReportsTab() {
  const [active, setActive] = useState<ReportTab>('x');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [from, setFrom] = useState<string>(localISODate);
  const [to, setTo] = useState<string>(localISODate);

  useEffect(() => {
    // Z report does NOT auto-fetch
    if (active === 'z') return;

    fetchReport(active);
  }, [active, from, to]);


  async function fetchReport(type: ReportTab) {
    setLoading(true);
    try {
      let url = '';

      const fromTs = `${from}T00:00:00`;
      const toTs = `${to}T23:59:59`;

      if (type === 'x') url = '/api/reports/x';
      if (type === 'usage') url = `/api/reports/usage?from=${fromTs}&to=${toTs}`;
      if (type === 'sales') url = `/api/reports/sales?from=${fromTs}&to=${toTs}`;

      const res = await fetch(url);
      const json = await res.json();

      // guard: if API returned an { error } object
      if (json?.error) {
        setData({ message: `Error: ${String(json.error)}` });
      } else if (type === 'x') {
        // ensure we always have an array and numbers are coerced
        if (!Array.isArray(json) || json.length === 0) {
          setData({ message: 'No transactions for current day' });
        } else {
          setData(
            json.map((r: any) => ({
              hour_ms: Number(r.hour_ms ?? 0),
              orders_count: Number(r.orders_count ?? 0),
              gross_sales: Number(r.gross_sales ?? 0),
              items_sold: Number(r.items_sold ?? 0),
              sales: Number(r.gross_sales ?? 0),
            }))
          );
        }
      } else {
        // pass-through for usage/sales or z's POST result
        setData(json);
      }
    } catch (err) {
      setData({ message: `Error fetching report: ${String(err)}` });
    } finally {
      setLoading(false);
    }
  }

  async function runZReport() {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/z', { method: 'POST' });
      const json = await res.json();

      if (json?.error) {
        setData({ message: `Z-Report error: ${String(json.error)}` });
      } else {
        // store returned object { summary, deleted_transactions, deleted_items }
        setData(json);
      }
    } catch (err) {
      setData({ message: `Z-Report error: ${String(err)}` });
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'x', label: 'X-Report' },
    { id: 'z', label: 'Z-Report' },
    { id: 'usage', label: 'Product Usage' },
    { id: 'sales', label: 'Sales Report' },
  ] as const;

  const formatHourLabel = (val: number | string) => {
    const num = Number(val);

    if (!val && val !== 0) return null;
    if (Number.isNaN(num) || num <= 0) return null;

    const d = new Date(num);
    if (isNaN(d.getTime())) return '';

    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
      timeZone: 'America/Chicago',
    });
  };


  const renderChart = () => {
    if (!data || data === null) return null;
    if (data.message) return <div className="p-4 text-gray-600">{data.message}</div>;


    if (active === 'x') {
      if (!Array.isArray(data) || data.length === 0) {
        return <div className="p-4 text-gray-600">No hourly data for X-Report</div>;
      }

      const chartData = data.map((row: any) => ({
        hour: formatHourLabel(row.hour_ms) ?? '',
        sales: Number(row.sales ?? 0),
        orders: Number(row.orders_count ?? 0),
        items: Number(row.items_sold ?? 0),
      }));

      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            {/* we use `sales` (guaranteed number) as the dataKey to avoid NaN */}
            <Line type="monotone" dataKey="sales" stroke="var(--chart-color)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (active === 'z') {
      // z report returns an object with summary & deletion counts
      if (active === 'z' && data?.summary) {
        const s = data.summary;
        return (
          <div className="p-4 border rounded bg-white shadow-sm">
            <div className="mb-2 font-medium">Z-Report Summary ({String(s.day).slice(0, 10)})</div>
            <div>Total orders: {Number(s.total_orders ?? 0)}</div>
            <div>Gross sales: ${Number(s.gross_sales ?? 0).toFixed(2)}</div>
            <div>Avg order: ${Number(s.avg_order_amount ?? 0).toFixed(2)}</div>
            <div>Total items sold: {Number(s.total_items_sold ?? 0)}</div>
            <div className="mt-2 text-sm text-gray-600">
              Deleted transactions: {Number(data.deleted_transactions ?? 0)}; deleted items: {Number(data.deleted_items ?? 0)}
            </div>
          </div>
        );
      }

    }

    if (active === 'usage') {
      const chartData = Array.isArray(data) ? data.map((r: any) => ({ name: r.inventory_item, used: Number(r.total_used ?? 0) })) : [];
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="used" fill="var(--chart-color)" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (active === 'sales') {
      const chartData = Array.isArray(data) ? data.map((r: any) => ({ name: r.menu_item, qty: Number(r.qty_sold ?? 0), total: Number(r.total_sales ?? 0) })) : [];
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="qty" fill="var(--chart-color)" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div>
      <nav className="flex gap-2 border-b pb-4 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
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

          <button onClick={() => fetchReport(active)} className="px-3 py-2 bg-blue-600 text-white rounded shadow">
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

      {loading ? (
        <div className="p-4 text-gray-600">Loading...</div>
      ) : data === null ? (
        <div className="p-4 text-gray-600">Waiting...</div>
      ) : data?.message ? (
        <div className="p-4 text-gray-600">{data.message}</div>
      ) : (
        renderChart()
      )}

      <pre className="p-4 border border-gray-200 rounded max-h-[400px] text-black overflow-auto bg-gray-50 mt-4">
        {data ? JSON.stringify(data, null, 2) : ''}
      </pre>
    </div>
  );
}
