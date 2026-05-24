'use client';

import { useGameState } from '@/hooks/useGameState';
import Button from '@/components/ui/Button';
import LogPanel from '@/components/ui/LogPanel';
import ResourceBar from '@/components/ui/ResourceBar';

const EARTH_FIELD_BUTTONS = [
    { label: 'scavenge for metal', actionId: 'scavengeMetal' },
    { label: 'salvage tech trash', actionId: 'salvageTechTrash'},
];

const EARTH_CRAFTING_BUTTONS = [
    { label : 'craft circuitry (2 wire, 2 silicon)', actionId: 'craftCircuitry' },
];

export default function GameBoard() {
    const { state, doAction, save, reset } = useGameState();

    const isUnlocked = (actionId: string): boolean => {
        switch (actionId) {
            case 'scavengeMetal': return true;
            case 'salvageTechTrash': return state.unlocks.salvageTechTrash;
            case 'craftCircuitry': return state.unlocks.craftCircuitry;
            default: return false;
        }
    };

    
    const isDisabled = (actionId: string): boolean => {
        switch (actionId) {
            case 'scavengeMetal': 
                return false; 
            case 'salvageTechTrash': 
                return state.resources.techTrash < 1; 
            case 'craftCircuitry': 
                return state.resources.copperWire < 2 || state.resources.silicon < 2; 
            default: 
                return false;
        }
    };

    const hasUnlockedCrafting = EARTH_CRAFTING_BUTTONS.some(btn => isUnlocked(btn.actionId));

    return (
        <main className='min-h-screen bg-black text-white flex justify-center px-6 py-12'>
            <div className='w-full max-w-md flex flex-col gap-10'>
                <div>
                    <h1 className='text-xs font-mono text-zinc-600 uppercase tracking-widest'>
                        solaris
                    </h1>
                    <p className='text-xs font-mono text-zinc-700 mt-1'>
                        {state.currentPlanet}
                    </p>
                </div>

                <ResourceBar
                    resources={state.resources}
                    currentPlanet={state.currentPlanet}
                />
                <LogPanel log={state.log} />

                <div className='flex flex-col gap-2'>
                    <span className='text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1 select-none'>
                        field operations
                    </span>
                    {EARTH_FIELD_BUTTONS.filter(btn => isUnlocked(btn.actionId)).map(btn => (
                        <Button
                            key={btn.actionId}
                            label={btn.label}
                            actionId={btn.actionId}
                            cooldowns={state.cooldowns}
                            onAction={doAction}
                            disabled={isDisabled(btn.actionId)}
                        />
                    ))}
                </div>
                
                {hasUnlockedCrafting && (
                    <div className='flex flex-col gap-2 border-t border-zinc-900 pt-6'>
                        <span className='text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1 select-none'>
                            crafting
                        </span>
                        {EARTH_CRAFTING_BUTTONS.filter(btn => isUnlocked(btn.actionId)).map(btn => (
                            <Button
                                key={btn.actionId}
                                label={btn.label}
                                actionId={btn.actionId}
                                cooldowns={state.cooldowns}
                                onAction={doAction}
                                disabled={isDisabled(btn.actionId)}
                            />
                        ))}
                    </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-zinc-900">
                    <button onClick={save} className="text-xs font-mono text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer">
                        save
                    </button>
                    <button onClick={reset} className="text-xs font-mono text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer">
                        reset
                    </button>
                </div>
                
            </div> 
        </main>
    );
}