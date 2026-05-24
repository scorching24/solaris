'use client';

import { useEffect, useRef } from 'react';

interface LogPanelProps {
  log: string[];
}

export default function LogPanel({ log }: LogPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="border-l border-zinc-800 pl-4 min-h-32 max-h-48 overflow-y-auto flex flex-col gap-1 scrollbar-none">
      {log.map((line, i) => (
        <p
          key={i}
          className={`
            text-xs font-mono leading-relaxed transition-opacity duration-700
            ${i === log.length - 1 ? 'text-zinc-300' : 'text-zinc-600'}
          `}
        >
          {line}
        </p>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}