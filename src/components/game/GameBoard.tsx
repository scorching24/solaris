'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import Button from '@/components/ui/Button';
import LogPanel from '@/components/ui/LogPanel';
import ResourceBar from '@/components/ui/ResourceBar';

const PLANET_MUSIC: Record<string, string[]> = {
    earth: ['/music/earth1.mp3', '/music/earth2.mp3'],
};

const EARTH_FIELD_BUTTONS = [
    { label: 'scavenge for metal', actionId: 'scavengeMetal' },
    { label: 'salvage tech trash', actionId: 'salvageTechTrash'},
    { label: 'operate pumpjack [1 battery]', actionId: 'operatePumpjack'},
];

const EARTH_CRAFTING_BUTTONS = [
    { label : 'craft circuitry [2 wire, 2 silicon]', actionId: 'craftCircuitry' },
    { label: 'craft battery [1 circuitry, 8 scrap metal, 3 silicon]', actionId: 'craftBattery'},
    { label: 'craft copper piping [7 scrap metal, 2 wire, 3 crude]', actionId: 'craftCopperPiping'},
    { label: 'craft cooling module [2 circuitry, 6 pipes, 1 battery]', actionId: 'craftCoolingModule'},
]; 

export default function GameBoard() {
    const { state, doAction, save, reset } = useGameState();
    const [isMuted, setIsMuted] = useState<boolean>(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentTrackIndexRef = useRef<number>(0);
    const activePlanetRef = useRef<string>('');
    
    const isMutedRef = useRef<boolean>(false);

    useEffect(() => {
        isMutedRef.current = isMuted;
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : 0.05;
        }
    }, [isMuted]);

    useEffect(() => {
        const tracks = PLANET_MUSIC[state.currentPlanet];
        if (!tracks || tracks.length === 0) return;

        const isNewPlanet = activePlanetRef.current !== state.currentPlanet;

        if (!audioRef.current) {
            currentTrackIndexRef.current = 0;
            audioRef.current = new Audio(tracks[0]);
            activePlanetRef.current = state.currentPlanet;
        } else if (isNewPlanet) {
            currentTrackIndexRef.current = 0;
            audioRef.current.pause();
            audioRef.current.src = tracks[0];
            activePlanetRef.current = state.currentPlanet;
            audioRef.current.load();
        }

        audioRef.current.loop = false;
        audioRef.current.volume = isMutedRef.current ? 0 : 0.05;

        const handleTrackEnded = () => {
            const currentPlanetKey = state.currentPlanet; 
            const activeTracks = PLANET_MUSIC[currentPlanetKey];
            if (!activeTracks || !audioRef.current) return;

            const nextIndex = (currentTrackIndexRef.current + 1) % activeTracks.length;
            currentTrackIndexRef.current = nextIndex;

            audioRef.current.pause();
            audioRef.current.src = activeTracks[nextIndex];
            audioRef.current.volume = isMutedRef.current ? 0 : 0.05;
            audioRef.current.load();
            
            audioRef.current.play().catch(err => {
                console.log("Media gesture interruption bypassed:", err);
            });
        };

        audioRef.current.addEventListener('ended', handleTrackEnded);

        if (audioRef.current.paused) {
            audioRef.current.play().catch(() => {
            });
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('ended', handleTrackEnded);
            }
        };
    }, [state.currentPlanet]); 

    const isUnlocked = (actionId: string): boolean => {
        switch (actionId) {
            case 'scavengeMetal': return true;
            case 'salvageTechTrash': return state.unlocks.salvageTechTrash;
            case 'craftCircuitry': return state.unlocks.craftCircuitry;
            case 'craftBattery': return state.unlocks.craftBattery;
            case 'operatePumpjack': return state.unlocks.operatePumpjack;
            case 'craftCopperPiping': return state.unlocks.craftCopperPiping;
            case 'craftCoolingModule': return state.unlocks.craftCoolingModule;
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
            case 'craftBattery':
                return state.resources.circuitry < 1 || state.resources.scrapMetal < 8 || state.resources.silicon < 3;
            case 'operatePumpjack':
                return state.resources.battery < 1;
            case 'craftCopperPiping':
                return state.resources.scrapMetal < 7 || state.resources.copperWire < 2 || state.resources.crudeOil < 3;
            case 'craftCoolingModule':
                return state.resources.circuitry < 2 || state.resources.copperPiping < 6 || state.resources.battery < 1;
            default: 
                return false;
        }
    };

    const hasUnlockedCrafting = EARTH_CRAFTING_BUTTONS.some(btn => isUnlocked(btn.actionId));

    const handleButtonClick = (actionId: string) => {
        doAction(actionId);
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(err => console.log("wake up link pending", err));
        }
    };

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
                            onAction={handleButtonClick}
                            disabled={isDisabled(btn.actionId)}
                        />
                    ))}
                </div>
                
                {hasUnlockedCrafting && (
                    <div className='flex flex-col gap-2 border-t border-zinc-900 pt-6'>
                        <span className='text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1 select-none'>
                            crafting
                        </span>
                        {EARTH_CRAFTING_BUTTONS.filter(btn => {
                            if (!isUnlocked(btn.actionId)) return false;

                            if (btn.actionId === 'craftCoolingModule' && state.unlocks.craftedCoolingModule) {
                                return false;
                            }

                            return true;
                        }).map(btn => (
                            <Button
                                key={btn.actionId}
                                label={btn.label}
                                actionId={btn.actionId}
                                cooldowns={state.cooldowns}
                                onAction={handleButtonClick}
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
                    <button 
                        onClick={() => setIsMuted(!isMuted)} 
                        className="text-xs font-mono text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer ml-auto"
                    >
                        {isMuted ? 'unmute' : 'mute'}
                    </button>
                </div>
                
            </div> 
        </main>
    );
}