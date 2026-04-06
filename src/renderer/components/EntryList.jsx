import React from 'react';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EntryList({ entries, onDelete }) {
  if (!entries || entries.length === 0) {
    return (
      <div>
        <h2>History</h2>
        <div className="empty-state">
          No entries yet. Log your first temptation above!
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>History</h2>
      <div className="entry-list">
        {entries.map((entry) => (
          <div key={entry.id} className="entry-item">
            <div className={`entry-dot ${entry.choice}`} />
            <div className="entry-info">
              <div className="entry-what">{entry.what}</div>
              <div className="entry-meta">
                <span>{timeAgo(entry.created_at)}</span>
                <span className="entry-category">{entry.category}</span>
              </div>
            </div>
            <span className={`entry-choice ${entry.choice}`}>
              {entry.choice === 'good' ? 'Resisted' : 'Gave In'}
            </span>
            <button
              className="entry-delete"
              onClick={() => onDelete(entry.id)}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
