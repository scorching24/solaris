'use client';

import { useEffect, useState } from 'react';

interface ButtonProps {
    label: string;
    actionId: string;
    cooldowns: Record<string, number>;
    onAction: (actionId: string) => void;
    disabled?: boolean;
}

export default function Button({ label, actionId, cooldowns, onAction, disabled = false }: ButtonProps) {
    const [progress, setProgress] = useState(0);
    const [onCooldown, setOnCooldown] = useState(false);

    useEffect(() => {
        const endTime = cooldowns[actionId];
        if (!endTime) return;

        const total = endTime - Date.now();
        if (total <= 0) return;

        setOnCooldown(true);

        const interval = setInterval(() => {
            const remaining = endTime - Date.now();
            if (remaining <= 0) {
                setProgress(0);
                setOnCooldown(false);
                clearInterval(interval);
                return;
            }
            setProgress((1 - remaining / total) * 100);
        }, 50);

        return () => clearInterval(interval);
    }, [cooldowns[actionId]]);

    const handleClick = () => {
      console.log('button clicked, onCooldown:', onCooldown, 'disabled:', disabled);
      if (onCooldown || disabled) return;
      onAction(actionId);
  };

    return (
    <div className="w-full">
        <button
            onClick={handleClick}
            disabled={onCooldown || disabled}
            className={`
                w-full text-left px-4 py-2 text-sm font-mono border rounded
                transition-colors duration-150
                ${onCooldown || disabled
                    ? 'text-zinc-600 border-zinc-800 cursor-not-allowed'
                    : 'text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white cursor-pointer'
                }
            `}
        >
            {label}
        </button>

        <div className="h-px bg-zinc-800 w-full rounded-t">
            <div
                className="h-px bg-zinc-500 rounded transition-none"
                style={{ width: `${progress}%` }}
            />
        </div>
    </div>
);
}