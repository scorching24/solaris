import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, initialState } from '@/lib/gameState';
import { COOLDOWNS, UNLOCK_THRESHOLDS } from '@/lib/constants';
import { saveGame, loadGame, resetGame } from '@/lib/storage';

export function useGameState() {
    const [state, setState] = useState<GameState>(initialState);

    useEffect(() => {
        const saved = loadGame();
        if (saved) setState(saved);
    }, []);

    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        const interval = setInterval(() => {
            setState(prev => ({ ...prev }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    function addLog(log: string[], message: string): string[] {
        const next = [...log, message];
        return next.length > 15 ? next.slice(next.length - 15) : next;
    }

    const checkUnlocks = useCallback((s: GameState): { unlocks: GameState['unlocks']; log: string[] } => {
        const u = { ...s.unlocks };
        const r = s.resources;
        let currentLog = [...s.log];

        if (!u.salvageTechTrash && r.techTrash >= UNLOCK_THRESHOLDS.salvageTechTrash.techTrash) {
            u.salvageTechTrash = true;
            currentLog = addLog(currentLog, 'your dataset recognizes copper and silicon signatures within the components.');    
        }

        if (!u.craftCircuitry && r.silicon >= UNLOCK_THRESHOLDS.craftCircuitry.silicon && r.copperWire >= UNLOCK_THRESHOLDS.craftCircuitry.copperWire) {
            u.craftCircuitry = true;
            currentLog = addLog(currentLog, 'you pondered the idea of creating circuitry using the modules you possess.')
        }

        return { unlocks: u, log: currentLog };
    }, []);

    const doAction = useCallback((actionId: string) => {
        console.log('doAction called with:', actionId);
        setState(prev => {
            const now = Date.now();
            if (prev.cooldowns[actionId] && now < prev.cooldowns[actionId]) return prev;

            const next: GameState = {
                ...prev,
                resources: { ...prev.resources },
                cooldowns: { ...prev.cooldowns, [actionId]: now + COOLDOWNS[actionId] },
                log: [...prev.log]
            };

            let message = '';

            switch (actionId) {
                case 'scavengeMetal':
                    next.resources.scrapMetal += Math.floor(Math.random() * 2 + 1);
                    message = 'you dig through the rubble and find metal junk.';

                    if (Math.random() < 0.5){
                        next.resources.techTrash += 1;
                        message += ' you also discover some tech trash! ';
                    }
                    break;
                
                case 'salvageTechTrash':
                    if (next.resources.techTrash < 1) {
                        return prev;
                    }
                    next.resources.techTrash -= 1;
                    if (Math.random() < 0.7) {
                        if (Math.random() < 0.5) {
                            next.resources.copperWire += Math.floor(Math.random() * 2 + 1);
                            message = 'you strip the old terminal casing and salvage copper wire.'
                        } else {
                            next.resources.silicon += Math.floor(Math.random() * 2 + 1);
                            message = 'you crack open the unit and successfully extract silicon cores.'
                        }
                    } else {
                        message = 'your efforts to salvage the tech trash fails.'
                    }
                    break;
                
                case 'craftCircuitry':
                    if (next.resources.silicon < 2 || next.resources.copperWire < 2) {
                        return prev;
                    }
                    next.resources.silicon -= 2;
                    next.resources.copperWire -= 2;
                    next.resources.circuitry += 1;
                    message = 'you carefully craft circuitry using the components of tech trash.'
                    break;
                
                default:
                    return prev;
            }

            if (message) {
                next.log = addLog(next.log, message);
            }

            const unlockResult = checkUnlocks(next);
            next.unlocks = unlockResult.unlocks;
            next.log = unlockResult.log;
            return next;
        });
    }, [checkUnlocks]);

    const travelTo = useCallback((planet: GameState['currentPlanet']) => {
        setState(prev => ({
            ...prev,
            currentPlanet: planet,
            log: addLog(prev.log, `traveling to ${planet}.`),
        }));
    }, []);

    const save = useCallback(() => {
        saveGame(stateRef.current);
        setState(prev => ({ ...prev, log: addLog(prev.log, 'progress saved.') }));
    }, []);

    const reset = useCallback(() => {
        resetGame();
        setState(initialState);
    }, []);

    return { state, doAction, travelTo, save, reset };
}