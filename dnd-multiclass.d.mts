export const multiclassRequirements:Record<string,number[][]>;
export function classLevels(character:any):any[];
export function classLevel(character:any,name:string):number;
export function classLabel(character:any):string;
export function multiclassIssues(character:any,options?:{abilities?:boolean}):string[];
export function castingAbilityFor(name:string):number|undefined;
export function thirdCaster(row:any):boolean;
export function subclassSpellGuide(row:any):{cantrips:number,prepared:number}|null;
