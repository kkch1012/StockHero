'use client';

interface UsageIndicatorProps {
  used: number;
  limit: number;
  label?: string;
}

export function UsageIndicator({ used, limit, label }: UsageIndicatorProps) {
  const isUnlimited = limit === -1 || limit >= 9999;
  const remaining = isUnlimited ? Infinity : limit - used;
  const isNearLimit = !isUnlimited && remaining <= Math.ceil(limit * 0.2);
  const isAtLimit = !isUnlimited && remaining <= 0;

  if (isUnlimited) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded text-xs font-medium">
        {label && <span className="text-dark-400">{label}</span>}
        <span>무제한</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        isAtLimit
          ? 'bg-red-500/10 text-red-400'
          : isNearLimit
          ? 'bg-yellow-500/10 text-yellow-400'
          : 'bg-dark-700 text-dark-300'
      }`}
    >
      {label && <span className="text-dark-400">{label}</span>}
      <span className="font-bold">{remaining}</span>
      <span className="text-dark-500">/ {limit}회 남음</span>
    </span>
  );
}
