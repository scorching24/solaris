'use client';

import { Resources } from '@/lib/gameState';

interface ResourceBarProps {
    resources: Resources;
    currentPlanet: string;
}

const RESOURCE_LABELS: Partial<Record<keyof Resources, string>> = {
    scrapMetal: 'scrapMetal',
    techTrash: 'techTrash',
    copperWire: 'copperWire',
    silicon: 'silicon',
    circuitry: 'circuitry',
    battery: 'battery',
    copperPiping: 'copperPiping',
    crudeOil: 'crudeOil',
};

const PLANET_RESOURCES: Record<string, (keyof Resources)[]> = {
    earth: ['scrapMetal', 'techTrash', 'copperWire', 'silicon', 'circuitry', 'battery', 'copperPiping', 'crudeOil',],
};

export default function ResourceBar({
    resources,
    currentPlanet,
}: ResourceBarProps) {
    const visibleResources = PLANET_RESOURCES[currentPlanet] ?? [];

    return (
    <div className="flex flex-col gap-3">

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {visibleResources
          .filter(key => resources[key] > 0)
          .map(key => (
            <div key={key} className="flex flex-col">
              <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
                {RESOURCE_LABELS[key]}
              </span>
              <span className="text-sm font-mono text-zinc-300">
                {Math.floor(resources[key])}
              </span>
            </div>
          ))}
      </div>
    </div>
    );
}