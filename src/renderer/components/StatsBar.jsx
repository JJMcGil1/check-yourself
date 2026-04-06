import React from 'react';

export default function StatsBar({ stats }) {
  const rate = stats.total > 0 ? Math.round((stats.good / stats.total) * 100) : 0;
  const rateColor = rate >= 50 ? 'var(--success)' : 'var(--danger)';
  const rateGlow = rate >= 50
    ? '0 0 24px rgba(52, 211, 153, 0.35)'
    : '0 0 24px rgba(251, 113, 133, 0.35)';

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
        <div
          className="stat-rate-value"
          style={{
            color: rateColor,
            textShadow: rateGlow,
          }}
        >
          {stats.total > 0 ? `${rate}%` : '—'}
        </div>
        <div className="stat-rate-label">Resist Rate</div>
      </div>
    </div>
  );
}
