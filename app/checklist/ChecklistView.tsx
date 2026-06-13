'use client';

import { useState, useEffect } from 'react';

interface ChecklistEntry {
  id: string;
  entry_date: string;
  task_key: string;
  is_done: boolean;
  done_at: string | null;
}

const TASK_LABELS: Record<string, string> = {
  'checklist.open_doors': 'Ouvrir les portes',
  'checklist.check_temperatures': 'Vérifier les températures',
  'checklist.prepare_sauces': 'Préparer les sauces',
  'checklist.setup_tables': 'Dresser les tables',
  'checklist.check_stock': 'Vérifier les stocks',
  'checklist.clean_kitchen': 'Nettoyer la cuisine',
  'checklist.check_hygiene': 'Contrôle hygiène',
};

interface ChecklistViewProps {
  userId: string;
}

export function ChecklistView({ userId }: ChecklistViewProps) {
  const [entries, setEntries] = useState<ChecklistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/checklist')
      .then((r) => r.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggleItem(entryId: string) {
    const res = await fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id: entryId, user_id: userId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    }
  }

  const done = entries.filter((e) => e.is_done).length;
  const total = entries.length;
  const allComplete = total > 0 && done === total;

  return (
    <div className="space-y-4">
      {allComplete && (
        <div className="bg-green-100 border border-green-400 text-green-800 rounded-lg p-4 text-center font-semibold text-lg">
          Checklist ouverture complète ✓
        </div>
      )}

      <p className="text-sm text-gray-500">
        {done}/{total} tâches complétées
      </p>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Chargement…</div>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-3"
            >
              <button
                onClick={() => !entry.is_done && toggleItem(entry.id)}
                disabled={entry.is_done}
                aria-label={entry.is_done ? 'Tâche complétée' : 'Marquer comme fait'}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  entry.is_done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {entry.is_done && '✓'}
              </button>
              <span
                className={`flex-1 ${
                  entry.is_done ? 'line-through text-gray-400' : 'text-gray-800'
                }`}
              >
                {TASK_LABELS[entry.task_key] ?? entry.task_key}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
