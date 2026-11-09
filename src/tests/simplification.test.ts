import {describe,it,expect} from 'vitest';
import {defaults,type ExerciseProgress} from '../domain/types';
import {favoritePerformance,reportHighlights,briefNote} from '../domain/presentation';
import type {AuditNote} from '../domain/experience';

const row=(id:string,value:number):ExerciseProgress=>({workoutId:id,date:Number(id)*86400000,weight:value,reps:8,e1rm:value*1.2,comparable:value,repsAtWeight:null,volume:value*8,sets:1});
const note=(key:string,group:AuditNote['group']):AuditNote=>({key,group,title:'Progression mesurée : Bench Press',evidence:'5 % à 8 ± 1 reps, 4 dernières séances comparables contre les 4 précédentes.',interpretation:'Descriptif.',action:'Examiner les séries.',target:'Progression',priority:50});

describe('cartes de favoris',()=>{
 it('privilégie la charge à répétitions comparables et conserve la conversion existante',()=>{const s=favoritePerformance([row('1',100),row('2',110)],{...defaults,unit:'kg'});expect(s.metric).toBe('comparable');expect(s.change?.percent).toBeCloseTo(10);expect(s.change?.absolute).toBeCloseTo(4.5359237);expect(s.points[0]).toBeCloseTo(45.359237);});
 it('ne transforme pas une seule mesure en progression',()=>{expect(favoritePerformance([row('1',100)],defaults).change).toBeNull();expect(favoritePerformance([],defaults).metric).toBeNull();});
 it('utilise e1RM en repli explicitement nommé, sans inventer des séances comparables',()=>{const s=favoritePerformance([{...row('1',100),comparable:null}],defaults);expect(s.metric).toBe('e1rm');expect(s.label).toBe('Charge estimée sur une répétition');expect(s.change).toBeNull();});
 it('n’invente pas de charge pour les performances au poids du corps',()=>{const s=favoritePerformance([{...row('1',0),e1rm:null,comparable:null}],defaults);expect(s.metric).toBeNull();expect(s.points).toEqual([]);expect(s.latestText).toContain('charge non comparable');});
 it('nomme le repli charge brute au lieu de prétendre comparer les répétitions',()=>{const s=favoritePerformance([{...row('1',100),comparable:null,e1rm:null},{...row('2',110),comparable:null,e1rm:null}],defaults);expect(s.metric).toBe('weight');expect(s.label).toBe('Charge enregistrée par séance');});
});
describe('rapport simplifié et messages précis',()=>{
 it('ne force pas trois constats quand il n’existe que des informations de qualité',()=>{expect(reportHighlights([note('quality','attention')])).toEqual({progress:undefined,attention:undefined,action:undefined});});
 it('sélectionne un progrès, une attention et une piste issue de leurs données',()=>{const p=note('record-Bench','progress'),a=note('volume-change','attention');expect(reportHighlights([p,a,note('activity','attention')])).toEqual({progress:p,attention:a,action:a});});
 it('la formulation simple garde la mesure et les chiffres sans changer le constat source',()=>{const source=note('trend-Bench','progress'),original=structuredClone(source);const b=briefNote(source);expect(b.title).toContain('Charge comparable');expect(b.evidence).toBe('5 % à 8 ± 1 reps · 4 dernières séances vs 4 précédentes.');expect(source).toEqual(original);});
});
