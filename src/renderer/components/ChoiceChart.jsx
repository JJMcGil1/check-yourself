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
      background: 'rgba(26, 26, 31, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      lineHeight: 1.6,
    }}>
      <div style={{ fontWeight: 600, color: '#F0F0F2', marginBottom: 2 }}>
        {formatDate(label)}
      </div>
      <div style={{ color: '#34D399', fontWeight: 600 }}>
        Resisted: {good}
      </div>
      <div style={{ color: '#FB7185', fontWeight: 600 }}>
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
              <stop offset="0%" stopColor="#34D399" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#34D399" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradBad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB7185" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#FB7185" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="none" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#55555F', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
            axisLine={false}
            tickLine={false}
            dy={4}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#55555F', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.06)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="good"
            stroke="#34D399"
            strokeWidth={2.5}
            fill="url(#gradGood)"
            dot={false}
            activeDot={{ r: 5, fill: '#34D399', stroke: '#0C0C0E', strokeWidth: 3 }}
            name="Resisted"
          />
          <Area
            type="monotone"
            dataKey="bad"
            stroke="#FB7185"
            strokeWidth={2}
            fill="url(#gradBad)"
            dot={false}
            activeDot={{ r: 5, fill: '#FB7185', stroke: '#0C0C0E', strokeWidth: 3 }}
            name="Gave In"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
