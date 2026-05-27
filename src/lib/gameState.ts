import { Planet, Resource } from './constants';

export type Resources = Record<Resource,number>

export type Unlocks = {
    salvageTechTrash : boolean;
    craftCircuitry: boolean;
    craftBattery: boolean;
    operatePumpjack: boolean;
    craftCopperPiping: boolean;
    craftCoolingModule: boolean;
    craftedCoolingModule: boolean;
    refineCrudeOil: boolean;
    mars: boolean;
};

export type GameState = {
    currentPlanet: Planet;
    resources: Resources;
    unlocks: Unlocks;
    cooldowns: Record<string, number>;
    log: string[];
    tick: number;
};

export const initialState: GameState = {
    currentPlanet: 'earth',
    resources: {
        scrapMetal : 0,
        techTrash : 0,
        copperWire : 0,
        silicon : 0,
        circuitry: 0,
        battery: 0,
        copperPiping: 0,
        crudeOil: 0,
    },
    unlocks: {
        salvageTechTrash: false,
        craftCircuitry: false,
        craftBattery: false,
        operatePumpjack: false,
        craftCopperPiping: false,
        craftCoolingModule: false,
        craftedCoolingModule: false,
        refineCrudeOil: false,
        mars: false,
    },
    cooldowns: {},
    log: [],
    tick: 0,

};