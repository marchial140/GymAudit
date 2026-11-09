import {RefreshCw,Database} from 'lucide-react';
import {freshness} from '../domain/weeklyReview';
import {day} from '../domain/experience';
import type {Dataset} from '../domain/types';
export function DataFreshness({data,onImport}:{data:Dataset;onImport:()=>void}) {
  const info=freshness(data);
  return <div className="data-freshness"><Database size={14}/><div><span>Dernière séance importée : <strong>{info.last===null?'aucune':day(info.last)}</strong></span>{info.days!==null&&info.days>7&&<small>Si vous vous êtes entraîné depuis, actualisez votre export pour inclure ces séances.</small>}</div><button onClick={onImport} aria-label="Actualiser mon export CSV"><RefreshCw size={13}/>Actualiser</button></div>;
}
