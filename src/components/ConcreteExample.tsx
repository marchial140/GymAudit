import {ArrowRight} from 'lucide-react';
import {toUnit} from '../domain/analysis';
import {number as n,day,signed} from '../domain/experience';
import {pairText,pairDates,type ConcretePair} from '../domain/concrete';
export function ConcreteExample({pair,unit,proof=false}:{pair:ConcretePair;unit:'lb'|'kg';proof?:boolean}) {
  return <div className="concrete-example">
    <span className="eyebrow">MÊMES RÉPÉTITIONS · CHARGES ENREGISTRÉES</span>
    <strong className="concrete-values">{pairText(pair,unit)}</strong>
    <small>{pairDates(pair)}</small>
    <p>{signed(toUnit(pair.delta,unit))} {unit} · {signed(pair.percent)} % observés. Ce n’est pas une tendance confirmée.</p>
    {proof&&<div className="concrete-proof">{[['Avant',pair.before],['Après',pair.after]].map(([label,observed])=>{
      const row=observed as ConcretePair['before'];return <div key={String(label)}><span>{String(label)} · {day(row.date)}</span><b>{n(toUnit(row.set.weight!,unit))} {unit} × {row.set.reps}</b><small>Type : {row.set.type} · RPE : {row.set.rpe??'non renseigné'} · Entrée source {row.set.id+1}</small></div>;
    })}</div>}
  </div>;
}
