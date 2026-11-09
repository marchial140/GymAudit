import {addDays,subWeeks,startOfWeek,endOfWeek,startOfDay,endOfDay,differenceInCalendarDays,format,isValid} from 'date-fns';
import {select,volume,toUnit,type Catalog} from './analysis';
import {statistics,compare,number as n,day,signed,personalRecords,recordLabels,type AuditNote} from './experience';
import {concreteBetween,pairText,type ConcretePair} from './concrete';
import type {Dataset,Preferences,AnalysisPeriod,Muscle} from './types';

export function lastCompleteWeek(now=new Date()) {return subWeeks(startOfWeek(now,{weekStartsOn:1}),1).getTime();}
export function weekPeriods(selected:number,now=new Date()) {
  if(!Number.isFinite(selected)||!isValid(now))throw new Error('Date de semaine invalide.');
  const start=startOfWeek(selected,{weekStartsOn:1}),currentStart=startOfWeek(now,{weekStartsOn:1});
  if(start>currentStart)throw new Error('Choisissez une semaine passée ou en cours.');
  const fullEnd=endOfWeek(start,{weekStartsOn:1}),end=new Date(Math.min(fullEnd.getTime(),endOfDay(now).getTime()));
  const previousStart=subWeeks(start,1),previousEnd=endOfDay(addDays(previousStart,differenceInCalendarDays(end,start)));
  return {current:{start:start.getTime(),end:end.getTime()},previous:{start:previousStart.getTime(),end:previousEnd.getTime()},ongoing:fullEnd.getTime()>now.getTime()};
}
export function freshness(data:Dataset,now=new Date()) {
  const last=data.workouts.length?Math.max(...data.workouts.map(w=>w.start)):null;
  return {last,days:last===null?null:Math.max(0,differenceInCalendarDays(now,last)),importedAt:data.importedAt};
}
export interface WeeklyNote {title:string;evidence:string;interpretation:string;action:string;target:AuditNote['target'];exercise?:string;muscle?:Muscle;anchor?:string;pair?:ConcretePair}
export function weeklyReview(data:Dataset,catalog:Catalog,prefs:Preferences,selected:number,now=new Date()) {
  const periods=weekPeriods(selected,now),current=select(data,periods.current),before=select(data,periods.previous);
  const stats=statistics(current,catalog,periods.current),prior=statistics(before,catalog,periods.previous),hasPrevious=before.workouts.length>0;
  const pairs=concreteBetween(data,catalog,prefs,periods.current,periods.previous);
  const records=personalRecords(data,catalog).filter(record=>record.date>=periods.current.start&&record.date<=periods.current.end);
  const currentVolume=volume(current,catalog,prefs),oldVolume=volume(before,catalog,prefs);
  const muscles=currentVolume.map(row=>({muscle:row.muscle,current:row.direct,before:hasPrevious?oldVolume.find(old=>old.muscle===row.muscle)!.direct:null,change:compare(row.direct,hasPrevious?oldVolume.find(old=>old.muscle===row.muscle)!.direct:null)}));
  const positive=pairs.filter(p=>p.delta>0).sort((a,b)=>b.after.date-a.after.date||a.exercise.localeCompare(b.exercise))[0];
  const record=records.find(r=>r.type==='e1rm');let progress:WeeklyNote|undefined;
  if(positive)progress={title:positive.exercise,evidence:pairText(positive,prefs.unit),interpretation:`Meilleures séries à ${positive.reps} répétitions et type ${positive.type}, sur les deux semaines. Différence observée, pas une tendance confirmée.`,action:'Vérifier les deux séries et poursuivre un suivi comparable.',target:'Progression',exercise:positive.exercise,anchor:'concrete-comparison',pair:positive};
  else if(record)progress={title:`Record estimé sur une répétition : ${record.exercise}`,evidence:`${day(record.date)} : ${n(toUnit(record.value,prefs.unit))} ${prefs.unit}, contre ${n(toUnit(record.before,prefs.unit))} ${prefs.unit} au meilleur niveau antérieur.`,interpretation:'Estimation d’Epley dans l’historique importé ; ce n’est pas un 1RM réellement testé ni une comparaison de semaines à répétitions identiques.',action:'Consulter les séries ayant produit cette estimation.',target:'Progression',exercise:record.exercise,anchor:'exercise-records'};
  const changed=muscles.filter(m=>m.change.absolute!==null&&m.change.absolute!==0).sort((a,b)=>Math.abs(b.change.absolute!)-Math.abs(a.change.absolute!)||a.muscle.localeCompare(b.muscle))[0];
  const setsChange=compare(stats.sets,hasPrevious?prior.sets:null);let change:WeeklyNote|undefined;
  if(current.workouts.length&&changed)change={title:`La répartition a changé : ${changed.muscle}`,evidence:`${changed.current} séries directes contre ${changed.before} (${signed(changed.change.absolute!)}).`,interpretation:'La différence est descriptive. Plus ou moins de volume ne signifie pas automatiquement mieux ou moins bien.',action:'Examiner les séances et exercices qui expliquent ce changement.',target:'Volume musculaire',muscle:changed.muscle,anchor:'muscle-detail'};
  else if(current.workouts.length&&hasPrevious)change={title:'Votre activité sur les deux semaines',evidence:`${stats.sessions} séances et ${stats.sets} séries, contre ${prior.sessions} séances et ${prior.sets} séries.`,interpretation:'Les semaines comparées couvrent les mêmes jours. Les séances non importées ne sont pas connues.',action:'Comparer les séances enregistrées et vérifier que votre import est complet.',target:'Tableau de bord',anchor:'weekly-activity'};
  const action=current.workouts.length?(change||progress||{title:'Continuer des comparaisons vérifiables',evidence:hasPrevious?'Aucune hausse vérifiable sur des séries à répétitions identiques.':'Aucune séance dans la semaine précédente pour établir une comparaison.',interpretation:'Les séries restent consultables. Une absence de comparaison ne prouve pas une absence de progrès.',action:'Importer un historique plus complet ou poursuivre les mêmes exercices avec des répétitions comparables.',target:'Progression' as const,anchor:'performance-summary'}):undefined;
  const missingRpe=current.sets.filter(s=>s.rpe===null).length,unknownExercises=new Set(current.sets.filter(s=>!catalog[s.exercise]?.classified).map(s=>s.exercise)).size;
  return {periods,stats,prior,hasPrevious,pairs,records,muscles,progress,change,action,setsChange,missingRpe,unknownExercises,entries:current.sets.length,latest:freshness(data,now)};
}
export type WeeklyReview=ReturnType<typeof weeklyReview>;
export function weeklyText(review:WeeklyReview,prefs:Preferences,generated=new Date()) {
  const {periods,stats,prior}=review;
  return ['GYMAUDIT — BILAN HEBDOMADAIRE',`${day(periods.current.start)} — ${day(periods.current.end)}${periods.ongoing?' (en cours)':''}`,`Comparaison : ${day(periods.previous.start)} — ${day(periods.previous.end)}`,`Généré le ${day(generated.getTime())}`,
    `${stats.sessions} séances · ${stats.sets} séries de musculation · ${n(stats.hours)} h (horaires de séances).`,
    review.hasPrevious?`Précédemment : ${prior.sessions} séances · ${prior.sets} séries.`:'Comparaison indisponible : aucune séance dans la semaine précédente.',
    review.progress?`CE QUI PROGRESSE\n${review.progress.title}\n${review.progress.evidence}\n${review.progress.interpretation}`:'CE QUI PROGRESSE\nAucune amélioration vérifiable avec les données disponibles.',
    review.change?`CE QUI A CHANGÉ\n${review.change.title}\n${review.change.evidence}\n${review.change.interpretation}`:'CE QUI A CHANGÉ\nAucune différence ne peut être établie avec les données disponibles.',
    review.action?`UNE PISTE À EXAMINER\n${review.action.action}`:'Aucune piste d’entraînement sans séances sur cette semaine.',
    'SÉRIES COMPARABLES — meilleures séries de chaque période, exercice/reps/type identiques',...review.pairs.map(p=>`${p.exercise} : ${pairText(p,prefs.unit)} (${day(p.before.date)} → ${day(p.after.date)}, ${p.type})`),
    'RECORDS OBSERVÉS — référence historique antérieure',...review.records.map(r=>`${day(r.date)} · ${r.exercise} · ${recordLabels[r.type]}${r.type==='reps'?` à ${n(toUnit(r.weight!,prefs.unit))} ${prefs.unit}`:''} : ${n(r.type==='reps'?r.before:toUnit(r.before,prefs.unit))} → ${n(r.type==='reps'?r.value:toUnit(r.value,prefs.unit))} ${r.type==='reps'?'reps':prefs.unit}`),
    'RÉPARTITION — séries directes',...review.muscles.map(m=>`${m.muscle} : ${m.current}, précédemment ${m.before??'indisponible'}`),
    `QUALITÉ : ${review.missingRpe}/${review.entries} RPE absents · ${review.unknownExercises} exercices non classés. Aucun diagnostic de fatigue, de technique ou de récupération. Les jours sans séance peuvent correspondre à du repos ou à des données non importées.`,
    review.latest.last===null?'Aucune séance importée.':`Dernière séance importée : ${day(review.latest.last)}. Import effectué le ${day(review.latest.importedAt)}.`].join('\n\n');
}
