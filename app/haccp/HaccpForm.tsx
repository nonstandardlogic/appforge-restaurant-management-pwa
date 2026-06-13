'use client';

import { useState } from 'react';

type HaccpLocation = 'cold_room' | 'prep_area' | 'dishwasher';

const LOCATION_LABELS: Record<HaccpLocation, string> = {
  cold_room: 'Chambre froide (≤ 4°C)',
  prep_area: 'Zone de préparation (≤ 4°C)',
  dishwasher: 'Lave-vaisselle (≥ 63°C)',
};

interface HaccpFormProps {
  userId: string;
}

export function HaccpForm({ userId }: HaccpFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [location, setLocation] = useState<HaccpLocation>('cold_room');
  const [temperature, setTemperature] = useState('');
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [lastResult, setLastResult] = useState<{ is_compliant: boolean; temperature_c: number } | null>(
    null
  );
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    const tempNum = parseFloat(temperature);
    if (isNaN(tempNum)) {
      setError('Température invalide');
      setStatus('error');
      return;
    }

    try {
      const res = await fetch('/api/haccp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_date: date,
          location,
          temperature_c: tempNum,
          notes: notes || undefined,
          recorded_by: userId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erreur serveur');
      }

      const log = await res.json();
      setLastResult({ is_compliant: log.is_compliant, temperature_c: log.temperature_c });
      setStatus('success');
      setTemperature('');
      setNotes('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  }

  return (
    <div className="space-y-4">
      {status === 'success' && lastResult && (
        <div
          className={`rounded-lg p-4 border font-semibold ${
            lastResult.is_compliant
              ? 'bg-green-100 border-green-400 text-green-800'
              : 'bg-red-100 border-red-400 text-red-800'
          }`}
        >
          {lastResult.is_compliant
            ? `✓ Conforme — ${lastResult.temperature_c}°C`
            : `✗ Non conforme — ${lastResult.temperature_c}°C — Action corrective requise`}
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-800 rounded-lg p-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value as HaccpLocation)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          >
            {(Object.keys(LOCATION_LABELS) as HaccpLocation[]).map((loc) => (
              <option key={loc} value={loc}>
                {LOCATION_LABELS[loc]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Température (°C)</label>
          <input
            type="number"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="ex: 3.5"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {status === 'submitting' ? 'Enregistrement…' : 'Enregistrer la température'}
        </button>
      </form>
    </div>
  );
}
