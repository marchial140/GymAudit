import {describe,it,expect} from 'vitest';
import {weekPeriods,lastCompleteWeek,weeklyReview,weeklyText,freshness} from '../domain/weeklyReview';
import {concreteBetween,concreteWithin,pairText} from '../domain/concrete';
import {makeCatalog} from '../data/catalog';
import {defaults,type Dataset} from '../domain/types';
import {volume,select} from '../domain/analysis';
const catalog=makeCatalog(['Bench Press (Barbell)','Bench Press (Dumbbell)','Cycling','Stretching','Pull Up (Weighted)']);
function data(rows:{date:string;weight?:number|null;reps?:number|null;type?:string;exercise?:string}[]):Dataset {
 const workouts=rows.map((row,i)=>({id:'w'+i,title:'Séance',start:new Date(row.date+'T17:00:00').getTime(),end:new Date(row.date+'T18:00:00').getTime(),description:''}));
 return {filename:'fictif.csv',importedAt:new Date('2026-11-09T12:00:00').getTime(),workouts,sets:rows.map((row,i)=>({id:i,workoutId:'w'+i,exercise:row.exercise||'Bench Press (Barbell)',type:row.type||'normal',weight:row.weight===undefined?100:row.weight,reps:row.reps===undefined?8:row.reps,index:0,rpe:null,duration:null,distance:null})),quality:{sourceRows:rows.length,invalidRows:0,warnings:[],missingRpe:rows.length,types:{normal:rows.length}}};
}
const now=new Date(2026,10,9,12);
const weeks=weekPeriods(new Date(2026,10,4).getTime(),now);
const pair=(rows:Parameters<typeof data>[0])=>concreteBetween(data(rows),catalog,defaults,weeks.current,weeks.previous);

describe('semaines calendaires et fraîcheur',()=>{
 it('prend la dernière semaine terminée, du lundi au dimanche, sans remplacer par la date du CSV',()=>{expect(new Date(lastCompleteWeek(now)).getDate()).toBe(2);const periods=weekPeriods(lastCompleteWeek(now),now);expect(new Date(periods.current.start).getDay()).toBe(1);expect(new Date(periods.current.end).getDay()).toBe(0);expect(new Date(periods.previous.start).getDate()).toBe(26);expect(new Date(periods.previous.end).getDate()).toBe(1);expect(periods.ongoing).toBe(false);});
 it('compare une semaine en cours aux mêmes jours de la semaine précédente',()=>{const n=new Date(2026,10,11,12),p=weekPeriods(n.getTime(),n);expect(new Date(p.current.start).getDate()).toBe(9);expect(new Date(p.current.end).getDate()).toBe(11);expect(new Date(p.previous.start).getDate()).toBe(2);expect(new Date(p.previous.end).getDate()).toBe(4);expect(p.ongoing).toBe(true);});
 it('ne confond pas une semaine calendrier avec 168 heures pendant un changement d’heure',()=>{const p=weekPeriods(new Date(2026,9,26).getTime(),now);expect(new Date(p.current.start).getHours()).toBe(0);expect(new Date(p.current.end).getHours()).toBe(23);expect(new Date(p.previous.start).getHours()).toBe(0);expect(new Date(p.previous.end).getHours()).toBe(23);if(Intl.DateTimeFormat().resolvedOptions().timeZone==='America/Toronto')expect((p.current.end-p.current.start+1)/3600000).toBe(169);});
 it('refuse une date invalide sans générer de bilan incohérent',()=>{expect(()=>weekPeriods(NaN,now)).toThrow('invalide');});
 it('refuse les semaines futures',()=>{expect(()=>weekPeriods(new Date(2026,11,1).getTime(),now)).toThrow();});
 it('distingue la dernière séance de la date d’import',()=>{const d=data([{date:'2026-11-07'}]);const f=freshness(d,now);expect(f.days).toBe(2);expect(f.last).not.toBe(f.importedAt);expect(freshness({...d,workouts:[]},now).last).toBeNull();});
});
describe('comparaisons concrètes strictes',()=>{
 it('montre de vraies séries à répétitions et type identiques',()=>{const p=pair([{date:'2026-10-30',weight:215},{date:'2026-11-06',weight:225}])[0];expect(p.before.set.weight).toBe(215);expect(p.after.set.weight).toBe(225);expect(p.delta).toBe(10);expect(p.reps).toBe(8);expect(pairText(p,'lb')).toBe('215 lb × 8 → 225 lb × 8');expect(pairText(p,'kg')).toContain('kg × 8');});
 it('ne mélange pas reps, types, variantes, warmup, cardio ou valeurs absentes',()=>{
 expect(pair([{date:'2026-10-30',reps:8},{date:'2026-11-06',reps:9}])).toEqual([]);
 expect(pair([{date:'2026-10-30'},{date:'2026-11-06',type:'dropset'}])).toEqual([]);
 expect(pair([{date:'2026-10-30'},{date:'2026-11-06',exercise:'Bench Press (Dumbbell)'}])).toEqual([]);
 for(const fields of [{type:'warmup'},{exercise:'Cycling'},{exercise:'Stretching'},{exercise:'Inconnu'},{weight:null},{weight:0},{reps:null}])expect(pair([{date:'2026-10-30',...fields},{date:'2026-11-06',...fields}])).toEqual([]);
 });
 it('choisit les meilleures séries de chaque semaine, pas juste la dernière ni une moyenne',()=>{const p=pair([{date:'2026-10-27',weight:100},{date:'2026-10-30',weight:110},{date:'2026-11-02',weight:120},{date:'2026-11-06',weight:115}])[0];expect(p.before.set.weight).toBe(110);expect(p.after.set.weight).toBe(120);});
 it('ne choisit pas une plage de reps uniquement parce qu’elle donne un plus gros gain',()=>{const p=pair([{date:'2026-10-30',weight:100,reps:8},{date:'2026-11-06',weight:95,reps:8},{date:'2026-10-30',weight:100,reps:9},{date:'2026-11-06',weight:150,reps:9}])[0];expect(p.reps).toBe(8);expect(p.delta).toBe(-5);});
 it('privilégie normal avant failure/dropset et garde les baisses et égalités',()=>{const p=pair([{date:'2026-10-30',weight:100},{date:'2026-11-06',weight:100},{date:'2026-10-30',type:'failure',weight:100},{date:'2026-11-06',type:'failure',weight:130}])[0];expect(p.type).toBe('normal');expect(p.percent).toBe(0);});
 it('dans une période, compare deux séances distinctes et garde les références sources',()=>{const d=data([{date:'2026-11-02',weight:100},{date:'2026-11-06',weight:110}]);const p=concreteWithin(d,catalog,defaults,weeks.current)[0];expect(p.before.set.id).toBe(0);expect(p.after.set.id).toBe(1);expect(concreteWithin(data([{date:'2026-11-06'}]),catalog,defaults,weeks.current)).toEqual([]);});
});
describe('bilan explicable, sans conclusions inventées',()=>{
 it('retient une hausse comparable avec ses deux séries sources',()=>{const d=data([{date:'2026-10-30',weight:215},{date:'2026-11-06',weight:225}]);const before=structuredClone(d),r=weeklyReview(d,catalog,defaults,weeks.current.start,now);expect(r.progress?.pair?.delta).toBe(10);expect(r.stats.sets).toBe(1);expect(r.prior.sets).toBe(1);expect(d).toEqual(before);});
 it('reste vide sans séances et indique explicitement la référence manquante',()=>{const d=data([{date:'2026-10-01'}]),r=weeklyReview(d,catalog,defaults,weeks.current.start,now);expect(r.stats.sessions).toBe(0);expect(r.progress).toBeUndefined();expect(r.change).toBeUndefined();expect(r.action).toBeUndefined();expect(r.hasPrevious).toBe(false);});
 it('ne présente pas un premier enregistrement comme une progression hebdomadaire',()=>{const r=weeklyReview(data([{date:'2026-11-06'}]),catalog,defaults,weeks.current.start,now);expect(r.progress).toBeUndefined();expect(r.hasPrevious).toBe(false);expect(r.action?.evidence).toContain('Aucune séance');});
 it('réutilise les formules de volume et les exclusions V1',()=>{const d=data([{date:'2026-10-30'},{date:'2026-11-06'},{date:'2026-11-06',type:'dropset'},{date:'2026-11-06',exercise:'Cycling'}]),r=weeklyReview(d,catalog,defaults,weeks.current.start,now);const v=volume(select(d,weeks.current),catalog,defaults);expect(r.muscles.find(m=>m.muscle==='Pectoraux')!.current).toBe(v.find(m=>m.muscle==='Pectoraux')!.direct);expect(r.stats.sets).toBe(2);expect(r.stats.sessions).toBe(3);});
 it('partage les dates des deux semaines, les vrais poids/reps et la qualité RPE',()=>{const r=weeklyReview(data([{date:'2026-10-30',weight:215},{date:'2026-11-06',weight:225}]),catalog,defaults,weeks.current.start,now);const text=weeklyText(r,defaults,now);expect(text).toContain('02/11/2026 — 08/11/2026');expect(text).toContain('26/10/2026 — 01/11/2026');expect(text).toContain('215 lb × 8 → 225 lb × 8');expect(text).toContain('1/1 RPE absents');});
});
