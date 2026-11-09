import {eligible,toUnit,type Catalog} from './analysis';
import {number as n,day} from './experience';
import type {Dataset,AnalysisPeriod,Preferences,WorkoutSet} from './types';

export interface ObservedSet {set:WorkoutSet;date:number;workoutId:string}
export interface ConcretePair {exercise:string;reps:number;type:string;before:ObservedSet;after:ObservedSet;delta:number;percent:number}
const priority:Record<string,number>={normal:0,failure:1,dropset:2};
function groups(data:Dataset,catalog:Catalog,prefs:Preferences,period:AnalysisPeriod) {
  const dates=new Map(data.workouts.filter(w=>w.start>=period.start&&w.start<=period.end).map(w=>[w.id,w.start]));
  const result=new Map<string,ObservedSet[]>();
  for(const set of data.sets){const date=dates.get(set.workoutId);if(date===undefined||!eligible(set,catalog)||set.weight===null||set.weight<=0||Math.abs(set.reps!-prefs.repTarget)>prefs.tolerance)continue;
    const key=JSON.stringify([set.exercise,set.reps,set.type]);const list=result.get(key)||[];list.push({set,date,workoutId:set.workoutId});result.set(key,list);
  }
  return result;
}
function best(rows:ObservedSet[]) {return [...rows].sort((a,b)=>b.set.weight!-a.set.weight!||b.date-a.date||a.set.id-b.set.id)[0];}
function pair(before:ObservedSet,after:ObservedSet):ConcretePair {
  const delta=after.set.weight!-before.set.weight!;
  return {exercise:after.set.exercise,reps:after.set.reps!,type:after.set.type,before,after,delta,percent:delta/before.set.weight!*100};
}
function representative(pairs:ConcretePair[],prefs:Preferences) {
  const chosen=new Map<string,ConcretePair>();
  for(const item of [...pairs].sort((a,b)=>(priority[a.type]-priority[b.type])||Math.abs(a.reps-prefs.repTarget)-Math.abs(b.reps-prefs.repTarget)||b.after.date-a.after.date||a.reps-b.reps))if(!chosen.has(item.exercise))chosen.set(item.exercise,item);
  return [...chosen.values()].sort((a,b)=>a.exercise.localeCompare(b.exercise));
}
// Entre deux périodes : meilleures séries à reps ET type identiques, même exercice exact.
// Le choix représentatif privilégie normal, puis la proximité de la cible de reps, pas le plus gros gain.
export function concreteBetween(data:Dataset,catalog:Catalog,prefs:Preferences,current:AnalysisPeriod,previous:AnalysisPeriod) {
  const after=groups(data,catalog,prefs,current),before=groups(data,catalog,prefs,previous),pairs:ConcretePair[]=[];
  for(const [key,rows] of after){const old=before.get(key);if(old?.length)pairs.push(pair(best(old),best(rows)));}
  return representative(pairs,prefs);
}
// Dans une période : meilleure série des première et dernière séances d’un même groupe comparable.
export function concreteWithin(data:Dataset,catalog:Catalog,prefs:Preferences,period:AnalysisPeriod) {
  const pairs:ConcretePair[]=[];
  for(const rows of groups(data,catalog,prefs,period).values()){
    const chronological=[...rows].sort((a,b)=>a.date-b.date||a.workoutId.localeCompare(b.workoutId));const first=chronological[0],last=chronological.at(-1)!;
    if(first.date>=last.date||first.workoutId===last.workoutId)continue;
    pairs.push(pair(best(rows.filter(row=>row.workoutId===first.workoutId)),best(rows.filter(row=>row.workoutId===last.workoutId))));
  }
  return representative(pairs,prefs);
}
export function pairText(item:ConcretePair,unit:'lb'|'kg') {return `${n(toUnit(item.before.set.weight!,unit))} ${unit} × ${item.reps} → ${n(toUnit(item.after.set.weight!,unit))} ${unit} × ${item.reps}`;}
export function pairDates(item:ConcretePair) {return `${day(item.before.date)} → ${day(item.after.date)} · ${item.type}`;}
