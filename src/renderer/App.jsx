import React, { useState, useEffect, useCallback } from 'react';
import LogForm from './components/LogForm';
import EntryList from './components/EntryList';
import ChoiceChart from './components/ChoiceChart';
import StatsBar from './components/StatsBar';

export default function App() {
  const [entries, setEntries] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [stats, setStats] = useState({ total: 0, good: 0, bad: 0 });

  const refresh = useCallback(async () => {
    const [e, d, s] = await Promise.all([
      window.api.getAllEntries(),
      window.api.getDailySummary(),
      window.api.getStats(),
    ]);
    setEntries(e);
    setDailySummary(d);
    setStats(s);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = async (entry) => {
    await window.api.addEntry(entry);
    refresh();
  };

  const handleDelete = async (id) => {
    await window.api.deleteEntry(id);
    refresh();
  };

  return (
    <div className="app">
      <header className="titlebar">
        <span className="titlebar-text">Check Yourself</span>
      </header>

      <main className="content">
        <div className="top-section">
          <LogForm onSubmit={handleAdd} />
          <StatsBar stats={stats} />
        </div>

        <div className="chart-section">
          <ChoiceChart data={dailySummary} />
        </div>

        <div className="list-section">
          <EntryList entries={entries} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
}
