import Papa from 'papaparse';
import {parse,isValid} from 'date-fns';
import {enUS} from 'date-fns/locale';
import type {Dataset,Workout,WorkoutSet} from '../domain/types';
const required=['title','start_time','end_time','description','exercise_title','superset_id','exercise_notes','set_index','set_type','weight_lbs','reps','distance_km','duration_seconds','rpe'];
export function parseDate(value:string):number|null {const d=parse(value.trim(),"MMM d, yyyy 'at' h:mm a",new Date(2000,0,1),{locale:enUS});return isValid(d)?d.getTime():null;}
export function numeric(value:string|undefined):number|null {if(value==null||value.trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&n>=0?n:null;}
export function parseHevy(text:string,filename:string):Dataset {
 const parsed=Papa.parse<Record<string,string>>(text.replace(/^\uFEFF/,''),{header:true,skipEmptyLines:'greedy',transformHeader:h=>h.trim()});
 const missing=required.filter(k=>!parsed.meta.fields?.includes(k)); if(missing.length)throw new Error('Colonnes manquantes : '+missing.join(', '));
 const workouts=new Map<string,Workout>(); const sets:WorkoutSet[]=[];const warnings:string[]=[];let invalidRows=0;const types:Record<string,number>={};
 const malformed=new Set(parsed.errors.filter(e=>e.row!==undefined).map(e=>e.row));
 parsed.data.forEach((r,i)=>{const start=parseDate(r.start_time||''),end=parseDate(r.end_time||'');
 if(malformed.has(i)||start===null||end===null||end<start||!r.exercise_title?.trim()||!r.title?.trim()){invalidRows++;if(warnings.length<20)warnings.push(`Ligne ${i+2} : date, séance ou exercice invalide.`);return;}
 const id=JSON.stringify([r.start_time,r.end_time,r.title]);workouts.set(id,{id,title:r.title,start,end,description:r.description});
 const type=r.set_type?.trim()||'unknown';types[type]=(types[type]||0)+1;
 for(const k of ['weight_lbs','reps','distance_km','duration_seconds','rpe'])if(r[k]?.trim()&&numeric(r[k])===null&&warnings.length<20)warnings.push(`Ligne ${i+2} : ${k} invalide, ignoré.`);
 const rep=numeric(r.reps),rpe=numeric(r.rpe);
 sets.push({supersetId:r.superset_id?.trim()||null,notes:r.exercise_notes||'',id:i,workoutId:id,exercise:r.exercise_title.trim(),type,weight:numeric(r.weight_lbs),reps:rep!==null&&Number.isInteger(rep)?rep:null,distance:numeric(r.distance_km),duration:numeric(r.duration_seconds),rpe:rpe!==null&&rpe<=10?rpe:null,index:numeric(r.set_index)});
 });
 if(!sets.length)throw new Error('Aucune série valide dans ce fichier.');
 return {filename,importedAt:Date.now(),workouts:[...workouts.values()].sort((a,b)=>a.start-b.start),sets,quality:{sourceRows:parsed.data.length,invalidRows,warnings,missingRpe:sets.filter(s=>s.rpe===null).length,types}};
}
