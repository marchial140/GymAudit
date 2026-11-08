export const muscles = ['Pectoraux','Dos / grand dorsal','Haut du dos','Biceps','Triceps','Deltoïdes avant','Deltoïdes latéraux','Deltoïdes arrière','Quadriceps','Ischio-jambiers','Fessiers','Mollets','Abdominaux','Lombaires','Autres'] as const;
export type Muscle = typeof muscles[number];
export type Category = 'strength'|'cardio'|'mobility'|'rehab'|'other';
export interface ExerciseDefinition {name:string; aliases?:string[]; category:Category; primary:Muscle[]; secondary:Muscle[]; classified:boolean; bodyweight?:boolean}
export interface WorkoutSet {supersetId?:string|null; notes?:string; id:number; workoutId:string; exercise:string; type:string; weight:number|null; reps:number|null; distance:number|null; duration:number|null; rpe:number|null; index:number|null}
export interface Workout {id:string; title:string; start:number; end:number; description:string}
export interface ExerciseEntry {exercise:string; sets:WorkoutSet[]}
export interface DataQualitySummary {sourceRows:number; invalidRows:number; warnings:string[]; missingRpe:number; types:Record<string,number>}
export interface Dataset {filename:string; importedAt:number; workouts:Workout[]; sets:WorkoutSet[]; quality:DataQualitySummary; demo?:boolean}
export interface AnalysisPeriod {start:number; end:number}
export interface MuscleVolume {muscle:Muscle; direct:number; indirect:number; equivalent:number; days:number; exercises:string[]}
export interface ExerciseProgress {date:number; workoutId:string; weight:number; reps:number; e1rm:number|null; volume:number; sets:number; comparable:number|null; repsAtWeight:number|null}
export interface Insight {exercise?:string; title:string; evidence:string; interpretation:string; action:string; target:'Volume musculaire'|'Progression'|'Paramètres'|'Tableau de bord'}
export interface Preferences {unit:'lb'|'kg'; theme:'dark'|'light'; indirect:number; dropset:number; repTarget:number; tolerance:number; referenceWeight:number}
export const defaults:Preferences={unit:'lb',theme:'dark',indirect:0.5,dropset:0.5,repTarget:8,tolerance:1,referenceWeight:100};
