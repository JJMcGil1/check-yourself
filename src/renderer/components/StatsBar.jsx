import React from 'react';

export default function StatsBar({ stats }) {
  const rate = stats.total > 0 ? Math.round((stats.good / stats.total) * 100) : 0;

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <div className="stat-value good">{stats.good || 0}</div>
        <div className="stat-label">Resisted</div>
      </div>
      <div className="stat-item">
        <div className="stat-value bad">{stats.bad || 0}</div>
        <div className="stat-label">Gave In</div>
      </div>
      <div className="stat-rate">
        <div className="stat-rate-value" style={{ color: rate >= 50 ? 'var(--good)' : 'var(--bad)' }}>
          {stats.total > 0 ? `${rate}%` : '—'}
        </div>
        <div className="stat-rate-label">Resist Rate</div>
      </div>
    </div>
  );
}
