import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const good = payload.find(p => p.dataKey === 'good')?.value || 0;
  const bad = payload.find(p => p.dataKey === 'bad')?.value || 0;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      lineHeight: 1.5,
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
        {formatDate(label)}
      </div>
      <div style={{ color: 'var(--good)', fontWeight: 500 }}>
        Resisted: {good}
      </div>
      <div style={{ color: 'var(--bad)', fontWeight: 500 }}>
        Gave in: {bad}
      </div>
    </div>
  );
};

export default function ChoiceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div>
        <h2>Trend</h2>
        <div className="chart-empty">
          Start logging temptations to see your trend here.
        </div>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <div>
      <h2>Trend</h2>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="gradGood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--good)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--good)" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="gradBad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--bad)" stopOpacity={0.1} />
              <stop offset="100%" stopColor="var(--bad)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="none" vertical={false} strokeOpacity={0.5} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
            axisLine={false}
            tickLine={false}
            dy={4}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="good"
            stroke="var(--good)"
            strokeWidth={2}
            fill="url(#gradGood)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--good)', stroke: '#fff', strokeWidth: 2 }}
            name="Resisted"
          />
          <Area
            type="monotone"
            dataKey="bad"
            stroke="var(--bad)"
            strokeWidth={2}
            fill="url(#gradBad)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--bad)', stroke: '#fff', strokeWidth: 2 }}
            name="Gave In"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
