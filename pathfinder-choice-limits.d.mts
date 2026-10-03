export function pfChoiceError(character: any, patch: any): string | undefined;
export function pfFeatError(character: any): string | undefined;
export function pfFeatSlots(character: any): Array<{category: string; level: number}>;
export function pfDailyCantrips(character: any): string[];
export function pfRemainingFeatSlots(character: any): Array<{category: string; level: number}>;
