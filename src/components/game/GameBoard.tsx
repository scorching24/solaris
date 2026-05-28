'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import Button from '@/components/ui/Button';
import LogPanel from '@/components/ui/LogPanel';
import ResourceBar from '@/components/ui/ResourceBar';

const PLANET_MUSIC: Record<string, string[]> = {
    earth: ['/music/1sec_silence.mp3','/music/earth2.mp3', '/music/earth3.mp3', '/music/earth1.mp3'],
};

const EARTH_FIELD_BUTTONS = [
    { label: 'scavenge for metal', actionId: 'scavengeMetal' },
    { label: 'salvage tech trash', actionId: 'salvageTechTrash'},
    { label: 'operate pumpjack [1 battery]', actionId: 'operatePumpjack'},
    { label: 'refine crude oil [15 crude]', actionId: 'refineCrudeOil'},
    { label: 'forge refined alloy [15 scrap, 2 petroleum coke, 1 heavy residue]', actionId: 'forgeRefinedAlloy'},
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
    
    const [isRefining, setIsRefining] = useState<boolean>(false);
    const [successCounter, setSuccessCounter] = useState<number>(0);

    const [spikePos, setSpikePos] = useState<number>(50);
    const [barPos, setBarPos] = useState<number>(40);
    const barWidth = 18;

    const [isForging, setIsForging] = useState<boolean>(false);
    const [forgeCharge, setForgeCharge] = useState<number>(0);
    const [forgeStrikes, setForgeStrikes] = useState<number>(0);
    const [targetMin, setTargetMin] = useState<number>(60);
    const [targetMax, setTargetMax] = useState<number>(82);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentTrackIndexRef = useRef<number>(0);
    const activePlanetRef = useRef<string>('');
    const isMutedRef = useRef<boolean>(false);
    const isPressingRef = useRef<boolean>(false);
    const minigameFrameRef = useRef<number | null>(null);

    const barPosRef = useRef<number>(40);
    const barVelocityRef = useRef<number>(0);
    const spikePosRef = useRef<number>(0);
    const spikeVelocityRef = useRef<number>(0);
    const targetSpikePosRef = useRef<number>(50);
    const targetTimerRef = useRef<number>(0);
    const successRef = useRef<number>(0);

    const forgeChargeRef = useRef<number>(0);
    const forgeDirectionRef = useRef<number>(1);

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

    useEffect(() => {
        if (!isRefining) {
            if (minigameFrameRef.current) cancelAnimationFrame(minigameFrameRef.current);
            return;
        }

        barPosRef.current = 40;
        barVelocityRef.current = 0;
        spikePosRef.current = 50;
        spikeVelocityRef.current = 0;
        targetSpikePosRef.current = 50;
        targetTimerRef.current = 0;
        successRef.current = 0;

        const updatePhysics = () => {
            targetTimerRef.current -=1;
            if (targetTimerRef.current <= 0) {
                targetSpikePosRef.current = Math.random() * 100;
                targetTimerRef.current = Math.floor(Math.random() * 120) + 100;
            }

            spikeVelocityRef.current += (targetSpikePosRef.current - spikePosRef.current) * 0.01;
            spikeVelocityRef.current *= 0.85;
            spikePosRef.current += spikeVelocityRef.current;

            if (spikePosRef.current < 0) spikePosRef.current = 0;
            if (spikePosRef.current > 100) spikePosRef.current = 100;

            if (isPressingRef.current) {
                barVelocityRef.current += 0.15;
            } else {
                barVelocityRef.current -= 0.12;
            }
            
            barVelocityRef.current = Math.max(-2.5, Math.min(2.5, barVelocityRef.current));
            barVelocityRef.current *= 0.85;

            barPosRef.current += barVelocityRef.current;

            if (barPosRef.current <= 0) {
                barPosRef.current = 0;
                barVelocityRef.current = 0;
            }
            const maxRightBoundary = 100 - barWidth;
            if (barPosRef.current >= maxRightBoundary) {
                barPosRef.current = maxRightBoundary;
                barVelocityRef.current = 0;
            }

            const isInsideWindow = spikePosRef.current >= barPosRef.current && spikePosRef.current <= (barPosRef.current + barWidth);

            if (isInsideWindow) {
                successRef.current = Math.min(100, successRef.current + 0.5);
            } else {
                successRef.current = Math.max(0, successRef.current - 0.3);
            }

            setSpikePos(spikePosRef.current);
            setBarPos(barPosRef.current);
            setSuccessCounter(Math.floor(successRef.current));

            if (successRef.current >= 100) {
                setIsRefining(false);
                doAction('refineCrudeOilSuccess');
                return;
            }

            minigameFrameRef.current = requestAnimationFrame(updatePhysics);
        };

        minigameFrameRef.current = requestAnimationFrame(updatePhysics)

        return () => {
            if (minigameFrameRef.current) cancelAnimationFrame(minigameFrameRef.current);
        };

    }, [isRefining, doAction, barWidth]);

    useEffect(() => {
        if (!isForging) {
            if (minigameFrameRef.current && !isRefining) cancelAnimationFrame(minigameFrameRef.current);
            return;
        }

        forgeChargeRef.current = 0;
        forgeDirectionRef.current = 1;
        setForgeStrikes(0);
        generateNewForgeWindow();

        const updateForgePhysics = () => {
            forgeChargeRef.current += (1.2 * forgeDirectionRef.current);

            if (forgeChargeRef.current >= 100) {
                forgeChargeRef.current = 100;
                forgeDirectionRef.current = -1;
            } else if (forgeChargeRef.current <= 0) {
                forgeChargeRef.current = 0;
                forgeDirectionRef.current = 1;
            }

            setForgeCharge(forgeChargeRef.current);
            minigameFrameRef.current = requestAnimationFrame(updateForgePhysics);

        };

        minigameFrameRef.current = requestAnimationFrame(updateForgePhysics);

        return () => {
            if (minigameFrameRef.current) cancelAnimationFrame(minigameFrameRef.current);
        };    
    }, [isForging]);

    const generateNewForgeWindow = () => {
        const min = Math.floor(Math.random() * 50) + 15;
        setTargetMin(min);
        setTargetMax(min + 22);  // AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    };
    
    const handleForgeStrike = () => {
        const exactCharge = forgeChargeRef.current;
        const isMovingRight = forgeDirectionRef.current > 0;

        const latencyOffset = 20;

        const effectiveMin = isMovingRight ? targetMin : targetMin - latencyOffset;
        const effectiveMax = isMovingRight ? targetMax + latencyOffset : targetMax;

        if (exactCharge >= effectiveMin && exactCharge <= effectiveMax) {
            const nextStrikes = forgeStrikes + 1;
            setForgeStrikes(nextStrikes);

            if (nextStrikes >= 3) {
                setIsForging(false);
                doAction('forgeRefinedAlloySuccess');
            } else {
                generateNewForgeWindow();
            }
        } else {
            setForgeStrikes(0);
            generateNewForgeWindow();
        }
    };

    const isUnlocked = (actionId: string): boolean => {
        switch (actionId) {
            case 'scavengeMetal': return true;
            case 'salvageTechTrash': return state.unlocks.salvageTechTrash;
            case 'craftCircuitry': return state.unlocks.craftCircuitry;
            case 'craftBattery': return state.unlocks.craftBattery;
            case 'operatePumpjack': return state.unlocks.operatePumpjack;
            case 'craftCopperPiping': return state.unlocks.craftCopperPiping;
            case 'craftCoolingModule': return state.unlocks.craftCoolingModule;
            case 'refineCrudeOil': return state.unlocks.refineCrudeOil;
            case 'forgeRefinedAlloy': return state.unlocks.forgeRefinedAlloy;
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
            case 'refineCrudeOil':
                return state.resources.crudeOil < 15;
            case 'forgeRefinedAlloy':
                return state.resources.scrapMetal < 15 || state.resources.petroleumCoke < 2 || state.resources.heavyResidue < 1;
            default: 
                return false;
        }
    };

    const hasUnlockedCrafting = EARTH_CRAFTING_BUTTONS.some(btn => isUnlocked(btn.actionId));

    const handleButtonClick = (actionId: string) => {
            if (actionId === 'refineCrudeOil') {
                setIsRefining(true);
                return;
            }

            if (actionId === 'forgeRefinedAlloy') {
                setIsForging(true);
                return;
            }

            doAction(actionId);
            if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(err => console.log("Audio gesture bypassed", err));
            }
        };

    return (
        <main className='min-h-screen bg-black text-white flex justify-center px-6 py-12'>
            <div className='w-full max-w-md flex flex-col gap-10'>
                <div>
                    <h1 className='text-xs font-bold animate-pulse text-amber-700 uppercase tracking-widest'>
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

            {isRefining &&(
                <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono text-xs select-none animate-fadeIn'>
                    <div className='w-full max-w-sm bg-zinc-950 border border-zinc-800 p-6 rounded flex flex-col gap-5 shadow-2xl'>
                        <div className='flex justify-between items-center border-b border-zinc-900 pb-3'>
                            <span className='text-zinc-400 font-bold uppercase tracking-wider text-[10px]'>OIL REFINING</span>
                            <span className='text-amber-700 font-bold animate-pulse text-[9px]'>SOLARIS</span>
                        </div>

                        <div className='flex flex-col gap-3 w-full'>
                            <div className='w-full h-12 bg-zinc-900 border border-zinc-800 rounded relative overflow-hidden'>
                                <div className='absolute top-0 bottom-0 bg-emerald-500/20 border-x-2 border-emerald-400 flex items-center justify-center'
                                style={{
                                    left: `${barPos}%`,
                                    width: `${barWidth}%`
                                }}
                            >
                            </div>

                            <div
                                className='absolute top-2 bottom-2 w-3 bg-red-500 rounded border border-white shadow-[0_0_10px_rgba(239,68,68,0.8)] flex items-center justify-center'
                                style={{ left: `${spikePos}%` }}
                            >
                            </div>

                        </div>
                        <div className='w-full h-3 bg-zinc-900 border border-zinc-800 rounded relative overflow-hidden flex justify-start items-stretch'>
                            <div
                                className='h-full bg-gradient-to-r from-zinc-900 to-zinc-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                style={{ width: `${successCounter}%`}}
                            />
                            </div>
                        </div>
                        
                        <div className='text-[10px] text-zinc-500 text-center italic leading-normal px-2'>
                            hold/tap the refinery button to keep the proper amount of coolant to maintain temperature regulation
                        </div>

                        <div className='flex flex-col gap-2'>
                            <button 
                                onMouseDown={() => { isPressingRef.current = true; }}
                                onMouseUp={() => { isPressingRef.current = false; }}
                                onMouseLeave={() => { isPressingRef.current = false; }}
                                onTouchStart={() => { isPressingRef.current = true; }}
                                onTouchEnd={() => { isPressingRef.current = false; }}
                                className='w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white py-4 rounded active:bg-black transition-colors cursor-pointer font-bold uppercase tracking-wider text-[11px] select-none touch-none'
                            >
                                increase coolant pressure
                            </button>

                            <button
                                onClick={() => setIsRefining(false)}
                                className='w-full text-center text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors pt-1 cursor-pointer'
                            >
                                abort fractionation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isForging && (
                <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono text-xs select-none animate-fadeIn'>
                    <div className='w-full max-w-sm bg-zinc-950 border border-zinc-800 p-6 rounded flex flex-col gap-5 shadow-2xl'>
                        <div className='flex justify-between items-center border-b border-zinc-900 pb-3'>
                            <span className='text-zinc-400 font-bold uppercase tracking-wider text-[10px]'>FORGING ALLOY</span>
                            <span className='text-amber-700 font-bold animate-pulse text-[9px]'>SOLARIS</span>
                        </div>

                        <div className='flex justify-between items-center px-1'>
                            <span className='text-zinc-500 text-[10px]'>THRESHOLD</span>
                            <div className='flex gap-2'>
                                {[1, 2, 3].map((s) => (
                                    <div
                                        key={s}
                                        className={`w-3 h-3 border rounded-sm transition-all duration-150 ${
                                            forgeStrikes >=s
                                                ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                                                : 'bg-zinc-900 border-zinc-800'
                                        }`}
                                    />
                                ))}   
                            </div>
                        </div>
                        <div className='flex flex-col gap-1 w-full'>
                            <div className='w-full h-10 bg-zinc-900 border border-zinc-800 rounded relative overflow-hidden'>
                                <div
                                    className='absolute top-0 bottom-0 bg-amber-500/20 border-x border-amber-500/60'
                                    style={{
                                        left: `${targetMin}%`,
                                        width: `${targetMax - targetMin}%`
                                    }}
                                />
                                <div
                                    className='absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,1)]'
                                    style={{ left: `${forgeCharge}%`}}
                                />
                            </div>
                        </div>
                        
                        <div className='text-[10px] text-zinc-500 text-center italic leading-normal px-2'>
                            actuate water quench when the temperature is within the threshold meter three times
                        </div>
                        
                        <div className='flex flex-col gap-2'>
                            <button
                                onClick={handleForgeStrike}
                                className='w-full bg-zinc-950 hover:bg-amber-900 border border-amber-700 text-amber-200 py-4 rounded active:scale-[0.99] transition-all cursor-pointer font-bold tracking-wider upopercase text-[11px]'
                            >
                                quench alloy
                            </button>
                            <button
                                onClick={() => setIsForging(false)}
                                className='w-full text-center text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors pt-1 cursor-pointer'
                            >
                                abort forge
                            </button>
                        </div>
                    </div>


                </div>
            )}

        </main>
    );
}