import { GameState } from './gameState';
import { SAVE_KEY } from './constants';

export function saveGame(state: GameState): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));

}

export function loadGame(): GameState | null {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
}

export function resetGame() : void {
    localStorage.removeItem(SAVE_KEY)
}