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

  const [zStarted, setZStarted] = useState(false);

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
    setZStarted(true);
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

  // map -> ensure numbers, filter invalid rows, sort
  const chartData = data
    .map((row: any) => ({
      hour_ms: Number(row.hour_ms ?? NaN),
      sales: Number(row.sales ?? NaN),
    }))
    .filter((r: any) => Number.isFinite(r.hour_ms) && Number.isFinite(r.sales))
    .sort((a: any, b: any) => a.hour_ms - b.hour_ms);

  // debug log
  console.log('x-report display data:', JSON.stringify(chartData, null, 2));

  // single-point: duplicate 1 hour later so Recharts draws a horizontal line
  const displayData =
    chartData.length === 1
      ? [
          chartData[0],
          { hour_ms: chartData[0].hour_ms + 60 * 60 * 1000, sales: chartData[0].sales },
        ]
      : chartData;

  // If after filtering there's no data, show message
  if (displayData.length === 0) {
    return <div className="p-4 text-gray-600">No valid hourly data for X-Report</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={displayData}
        margin={{ top: 12, right: 24, left: 12, bottom: 6 }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis
          dataKey="hour_ms"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(ms: number) => formatHourLabel(ms) || ''}
          tick={{ fontSize: 12 }}
          padding={{ left: 12, right: 12 }}
        />

        <YAxis />

        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #ddd',
            color: 'black',
          }}
          labelStyle={{ color: 'black' }}
          itemStyle={{ color: 'black' }}
        />


        <Line
          type="monotone"
          dataKey="sales"
          stroke="#705167ff"               // explicit color while debugging
          strokeWidth={3}
          dot={{ r: 1 }}
          activeDot={{ r: 6 }}
          isAnimationActive={false}      // disable animation (debugging)
          connectNulls={true}
        />
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
              if (t.id === 'z') setData(null);
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
              className="border p-1 rounded text-black"
            />
          </label>
          <label>
            To:{' '}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border p-1 rounded text-black"
            />
          </label>

          <button onClick={() => fetchReport(active)} className="px-3 py-2 bg-blue-600 text-white rounded shadow">
            Refresh
          </button>
        </div>
      )}

      {active === "z" && (
        <>
          <button
            onClick={runZReport}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Run Z-Report
          </button>

          {!zStarted && (
            <div className="mt-4 text-sm text-gray-600">
              You can only run a Z Report once per day so make sure you are ready before continuing.
            </div>
          )}

          {data && (
            <pre className="mt-4 p-4 bg-gray-100 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </>
      )}



      {loading ? (
        <div className="p-4 text-gray-600">Loading...</div>
      ) : data?.message ? (
        <div className="p-4 text-gray-600">{data.message}</div>
      ) : (
        renderChart()
      )}

      {active !== "z" && (
        <pre className="p-4 border border-gray-200 rounded max-h-[400px] text-black overflow-auto bg-gray-50 mt-4">
          {data ? JSON.stringify(data, null, 2) : ""}
        </pre>
      )}
    </div>
  );
}
