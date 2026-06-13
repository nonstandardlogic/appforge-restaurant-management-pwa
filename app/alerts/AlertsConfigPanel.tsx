'use client';

import { useState } from 'react';
import type { AlertConfig } from '@/lib/alerts/config';

interface Props {
  initialConfigs: AlertConfig[];
}

export default function AlertsConfigPanel({ initialConfigs }: Props) {
  const [configs, setConfigs] = useState<AlertConfig[]>(initialConfigs);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave(alertType: string, updates: Partial<AlertConfig>) {
    setSaving(alertType);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/alerts/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_type: alertType, ...updates }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json() as AlertConfig;
      setConfigs((prev) => prev.map((c) => (c.alert_type === updated.alert_type ? updated : c)));
      setSuccess(`${alertType} saved`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded">{success}</div>
      )}
      {configs.map((config) => (
        <AlertConfigCard
          key={config.alert_type}
          config={config}
          saving={saving === config.alert_type}
          onSave={(updates) => handleSave(config.alert_type, updates)}
        />
      ))}
    </div>
  );
}

interface CardProps {
  config: AlertConfig;
  saving: boolean;
  onSave: (updates: Partial<AlertConfig>) => void;
}

function AlertConfigCard({ config, saving, onSave }: CardProps) {
  const [enabled, setEnabled] = useState(config.enabled);
  const [threshold, setThreshold] = useState(String(config.threshold));
  const [recipientEmail, setRecipientEmail] = useState(config.recipient_email);
  const [recipientPhone, setRecipientPhone] = useState(config.recipient_phone);
  const [locale, setLocale] = useState(config.locale);

  const label =
    config.alert_type === 'daily_ca'
      ? 'Alerte CA journalier'
      : config.alert_type === 'weekly_mb'
      ? 'Alerte Marge Brute hebdomadaire'
      : config.alert_type;

  return (
    <div className="border rounded-lg p-5 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">{label}</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-600">Activée</span>
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seuil ({config.alert_type === 'daily_ca' ? '€' : '%'})
          </label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email destinataire</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone WhatsApp</label>
          <input
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="+33612345678"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() =>
            onSave({
              enabled,
              threshold: Number(threshold),
              recipient_email: recipientEmail,
              recipient_phone: recipientPhone,
              locale,
            })
          }
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
