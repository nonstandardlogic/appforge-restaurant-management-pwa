'use client';

import { useState } from 'react';

type Availability = 'DISPO' | 'REPOS';

interface DayEntry {
  day_of_week: number;
  availability: Availability;
  time_slot_start: string;
  time_slot_end: string;
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

interface HoursFormProps {
  staffId: string;
  weekStart: string;
}

export function HoursForm({ staffId, weekStart }: HoursFormProps) {
  const [days, setDays] = useState<DayEntry[]>(
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i + 1,
      availability: 'REPOS' as Availability,
      time_slot_start: '',
      time_slot_end: '',
    }))
  );
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  function updateDay(index: number, updates: Partial<DayEntry>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...updates } : d)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      const res = await fetch('/api/staff/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staffId,
          week_start: weekStart,
          days: days.map((d) => ({
            day_of_week: d.day_of_week,
            availability: d.availability,
            time_slot_start: d.time_slot_start || undefined,
            time_slot_end: d.time_slot_end || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erreur serveur');
      }

      setStatus('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-800 rounded-lg p-4">
          Heures enregistrées avec succès ✓
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-800 rounded-lg p-3">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Jour</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Dispo</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Début</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Fin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {days.map((day, i) => (
              <tr key={day.day_of_week}>
                <td className="px-4 py-2 text-sm font-medium text-gray-700">{DAY_NAMES[i]}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateDay(i, {
                        availability: day.availability === 'DISPO' ? 'REPOS' : 'DISPO',
                      })
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      day.availability === 'DISPO'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {day.availability}
                  </button>
                </td>
                <td className="px-4 py-2">
                  {day.availability === 'DISPO' && (
                    <input
                      type="time"
                      value={day.time_slot_start}
                      onChange={(e) => updateDay(i, { time_slot_start: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  {day.availability === 'DISPO' && (
                    <input
                      type="time"
                      value={day.time_slot_end}
                      onChange={(e) => updateDay(i, { time_slot_end: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-purple-600 text-white rounded-lg py-3 font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        {status === 'submitting' ? 'Enregistrement…' : 'Soumettre mes disponibilités'}
      </button>
    </form>
  );
}
