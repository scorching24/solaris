export const SAVE_KEY = 'solaris_save';

export const PLANETS = ['earth', 'mars'] as const;
export type Planet = typeof PLANETS[number]

export const RESOURCES = [
    'scrapMetal',
    'techTrash',
    'copperWire',
    'silicon',
    'circuitry',
    'crudeOil',
    'battery',
] as const;
export type Resource = typeof RESOURCES[number];

export const COOLDOWNS: Record<string, number> = {
    scavengeMetal: 3600,
    salvageTechTrash: 6700,
    craftCircuitry: 6700,
};

export const UNLOCK_THRESHOLDS = {
    salvageTechTrash: { techTrash: 1 },
    craftCircuitry: { silicon: 2, copperWire: 2 },
};