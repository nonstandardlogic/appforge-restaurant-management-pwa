'use client';

interface ValidatePlanningButtonProps {
  staffId: string;
  weekStart: string;
  validatedBy: string;
}

export function ValidatePlanningButton({
  staffId,
  weekStart,
  validatedBy,
}: ValidatePlanningButtonProps) {
  async function handleValidate() {
    const res = await fetch('/api/staff/planning', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff_id: staffId, week_start: weekStart, validated_by: validatedBy }),
    });
    if (res.ok) {
      window.location.reload();
    }
  }

  return (
    <button
      onClick={handleValidate}
      className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-indigo-700 transition-colors"
    >
      Valider
    </button>
  );
}
