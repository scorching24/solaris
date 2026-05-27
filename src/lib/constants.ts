export const SAVE_KEY = 'solaris_save';

export const PLANETS = ['earth', 'mars'] as const;
export type Planet = typeof PLANETS[number]

export const RESOURCES = [
    'scrapMetal',
    'techTrash',
    'copperWire',
    'silicon',
    'circuitry',
    'battery',
    'copperPiping',
    'crudeOil',
    'petrochemicals',
    'heavyResidue',
    'petroleumCoke',
] as const;
export type Resource = typeof RESOURCES[number];

export const COOLDOWNS: Record<string, number> = {
    scavengeMetal: 3600,
    salvageTechTrash: 6700,
    craftCircuitry: 6700,
    craftBattery: 9000,
    operatePumpjack: 10000,
    craftCopperPiping: 5000,
};

export const UNLOCK_THRESHOLDS = {
    salvageTechTrash: { techTrash: 1 },
    craftCircuitry: { silicon: 2, copperWire: 2 },
    craftBattery: { circuitry: 1, },
    operatePumpjack: { battery: 1 },
    craftCopperPiping: { crudeOil: 1 },
    craftCoolingModule: { copperPiping: 1 },
};