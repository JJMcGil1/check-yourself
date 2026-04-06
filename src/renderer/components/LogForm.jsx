import React, { useState } from 'react';

const CATEGORIES = [
  { value: 'food', label: 'Food / Delivery' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
];

export default function LogForm({ onSubmit }) {
  const [what, setWhat] = useState('');
  const [category, setCategory] = useState('food');

  const handleSubmit = (choice) => {
    if (!what.trim()) return;
    onSubmit({ what: what.trim(), category, choice });
    setWhat('');
  };

  return (
    <div className="log-form">
      <h2>What are you tempted by?</h2>
      <input
        type="text"
        value={what}
        onChange={(e) => setWhat(e.target.value)}
        placeholder="e.g. Uber Eats sushi order..."
        onKeyDown={(e) => {
          if (e.key === 'Enter' && what.trim()) handleSubmit('good');
        }}
        autoFocus
      />
      <div className="form-row">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="choice-buttons">
        <button
          className="btn-good"
          onClick={() => handleSubmit('good')}
          disabled={!what.trim()}
        >
          I Resisted
        </button>
        <button
          className="btn-bad"
          onClick={() => handleSubmit('bad')}
          disabled={!what.trim()}
        >
          I Gave In
        </button>
      </div>
    </div>
  );
}
