import {useMemo,useState} from 'react';
import {ArrowUpRight,Activity,Star,Plus,ChevronRight} from 'lucide-react';
import type {Audit,Navigate} from './AnalysisPanels';
import {number as n,day,signed,compare,progressFor,recordLabels} from '../domain/experience';
import {briefNote,favoritePerformance,reportHighlights} from '../domain/presentation';
import {weeksIn,previous as previousPeriod,type Catalog} from '../domain/analysis';
import type {AnalysisPeriod,Dataset,MuscleVolume,Preferences} from '../domain/types';

export function SimpleHome({audit,navigate}:{audit:Audit;navigate:Navigate}) {
  return <>
    <div className="simple-kpis">
      {[['Séances',audit.stats.sessions,'sur la période'],['Séries de musculation',audit.stats.sets,'hors échauffement et cardio'],['Temps total',n(audit.stats.hours)+' h','déduit des horaires de séance']].map(([label,value,caption]) =>
        <article className="simple-kpi" key={label}><span>{label}</span><strong>{typeof value==='number'?n(value):value}</strong><small>{caption}</small></article>)}
    </div>
    <section className="panel simple-observations"><div className="panel-heading"><div><h2>À retenir</h2><p>L’essentiel de votre période</p></div><Activity size={18}/></div>
      {audit.dashboard.map(note => {const brief=briefNote(note);return <button className="simple-observation" key={note.key} onClick={()=>navigate(note)}>
        <div><h3>{brief.title}</h3><p>{brief.evidence}</p><span>Comprendre ce résultat</span></div><ChevronRight size={18}/>
      </button>;})}
      {!audit.dashboard.length&&<p>Aucune observation sans séances enregistrées. Choisissez une période renseignée.</p>}
    </section>
  </>;
}

export function SimpleVolume({current,previous,period,hasPrevious,onMuscle}:{current:MuscleVolume[];previous:MuscleVolume[];period:AnalysisPeriod;hasPrevious:boolean;onMuscle:(name:string)=>void}) {
  const rows=[...current].map(row=>({...row,weekly:row.direct/weeksIn(period),change:compare(row.direct/weeksIn(period),hasPrevious?(previous.find(x=>x.muscle===row.muscle)?.direct||0)/weeksIn(previousPeriod(period)):null)})).sort((a,b)=>b.direct-a.direct||a.muscle.localeCompare(b.muscle));
  const max=Math.max(1,...rows.map(row=>row.weekly));
  return <section className="panel simple-volume"><span className="eyebrow">LA RÉPARTITION DE VOTRE TRAVAIL</span><h2>Séries directes par semaine</h2><p>Une série pour chaque muscle principal. La répartition décrit votre entraînement, sans définir un volume idéal.</p>
    {rows.map(row=><button key={row.muscle} className="simple-muscle" onClick={()=>onMuscle(row.muscle)} aria-label={`${row.muscle} : ${n(row.weekly)} séries directes par semaine. Voir les détails`}>
      <div className="simple-muscle-heading"><strong>{row.muscle}</strong><span>{n(row.weekly)}<small> / sem.</small></span></div>
      <div className="simple-muscle-track"><i style={{width:`${row.weekly/max*100}%`}}/></div>
      <div className="simple-muscle-caption"><span>{row.change.percent===null?row.change.before===null?'Comparaison indisponible':row.change.absolute===0?'Identique à la période précédente':'Base précédente nulle':`${row.change.percent>0?'+':''}${n(row.change.percent)} % vs période précédente`}</span><span>Voir les séries <ChevronRight size={12}/></span></div>
    </button>)}
    <p className="muted">La moyenne couvre tous les jours sélectionnés. Les estimations indirectes et équivalentes restent dans l’analyse complète.</p>
  </section>;
}

function Sparkline({values,label}:{values:number[];label:string}) {
  if(values.length<2)return null;
  const min=Math.min(...values),max=Math.max(...values),range=max-min||1;
  const points=values.map((value,i)=>`${4+i/(values.length-1)*272},${52-(value-min)/range*42}`).join(' ');
  return <svg className="favorite-sparkline" viewBox="0 0 280 60" role="img" aria-label={label}><title>{label}</title><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/></svg>;
}

export function FavoriteProgress({current,catalog,prefs,audit,names,favorites,saving,onFavorite,onExercise}: {
  current:Dataset;catalog:Catalog;prefs:Preferences;audit:Audit;names:string[];favorites:string[];saving:boolean;
  onFavorite:(name:string,selected:boolean)=>void;onExercise:(name:string)=>void;
}) {
  const [manager,setManager]=useState(false),[search,setSearch]=useState('');
  const visible=favorites.filter(name=>names.includes(name));
  const summaries=useMemo(()=>visible.map(name=>({name,summary:favoritePerformance(progressFor(current,catalog,name,prefs),prefs),record:audit.records.find(record=>record.exercise===name)})),[current,catalog,prefs,audit,favorites,names]);
  return <>
    <div className="favorites-heading"><div><span className="eyebrow">VOTRE SÉLECTION</span><h2>Mes exercices favoris</h2></div><button aria-expanded={manager} aria-controls="favorite-manager" onClick={()=>setManager(value=>!value)}><Star size={15}/>{manager?'Fermer la sélection':'Gérer les favoris'}</button></div>
    {manager&&<section className="panel favorite-manager" id="favorite-manager"><h3>Choisir mes exercices</h3><p>Sélectionnez les exercices que vous voulez retrouver à chaque ouverture. Vous pourrez toujours consulter les autres.</p><label>Rechercher dans l’import<input type="search" placeholder="Nom d’un exercice…" autoFocus value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="favorite-options">{names.filter(name=>name.toLowerCase().includes(search.toLowerCase())).map(name=><label key={name}><input type="checkbox" checked={favorites.includes(name)} disabled={saving} onChange={e=>onFavorite(name,e.target.checked)}/><span>{name}</span><Star size={14} fill={favorites.includes(name)?'currentColor':'none'}/></label>)}{!names.some(name=>name.toLowerCase().includes(search.toLowerCase()))&&<p>Aucun exercice correspondant dans cet import.</p>}</div><p className="muted" aria-live="polite">{saving?'Sauvegarde…':`${visible.length} favoris dans cet import · sauvegardés sur cet appareil`}</p>{favorites.length>visible.length&&<p className="muted">{favorites.length-visible.length} favoris absents de cet import restent conservés pour un prochain import.</p>}</section>}
    {!visible.length&&<section className="panel favorites-empty"><Star size={30}/><h3>Vos progrès, à portée de main.</h3><p>Choisissez quelques exercices pour suivre leurs performances ici, sans les rechercher à chaque fois.</p><button className="primary" onClick={()=>setManager(true)}><Plus size={16}/>Ajouter mes exercices favoris</button></section>}
    <div className="favorite-grid">{summaries.map(({name,summary,record})=><article className="panel favorite-card" key={name}>
      <div className="favorite-card-heading"><h3>{name}</h3><button className="icon-button" aria-label={`Retirer ${name} des favoris`} disabled={saving} onClick={()=>onFavorite(name,false)}><Star size={18} fill="currentColor"/></button></div>
      <span className="favorite-metric">{summary.label}</span><strong className="favorite-value">{summary.latestText}</strong>
      {summary.lastMeasured&&<small className="muted">Dernière mesure disponible : {day(summary.lastMeasured.date)}</small>}
      <Sparkline values={summary.points} label={`${summary.label} sur la période, ${summary.count} mesures disponibles`}/>
      <p className="favorite-change">{summary.change?`${signed(summary.change.absolute!)} ${prefs.unit} · ${summary.change.percent===null?'base nulle':signed(summary.change.percent)+' %'} observés sur la période`:'Au moins deux mesures utilisables sont nécessaires pour comparer.'}</p>
      <p className="favorite-record">{record?`${recordLabels[record.type]} · ${day(record.date)}`:'Aucun nouveau record vérifiable sur la période.'}</p>
      {summary.metric==='weight'&&<p className="muted">Les répétitions peuvent varier. Cette différence n’établit pas une tendance comparable.</p>}
      <button className="text-button" onClick={()=>onExercise(name)}>Analyse détaillée <ArrowUpRight size={15}/></button>
    </article>)}</div>
  </>;
}

export function SimpleReport({audit,navigate}:{audit:Audit;navigate:Navigate}) {
  const highlights=reportHighlights(audit.notes);
  return <section className="simple-report"><span className="eyebrow">VOTRE RAPPORT EN UN REGARD</span><h2>L’essentiel de votre entraînement</h2><p>Jusqu’à trois constats, uniquement quand les données les justifient.</p>
    {highlights.progress&&<article className="panel simple-report-card"><span className="report-category"><Activity size={16}/>Ce qui progresse</span><h3>{briefNote(highlights.progress).title}</h3><p>{briefNote(highlights.progress).evidence}</p><button className="text-button" onClick={()=>navigate(highlights.progress!)}>Voir les données <ArrowUpRight size={15}/></button></article>}
    {highlights.attention&&<article className="panel simple-report-card"><span className="report-category">Ce qui mérite attention</span><h3>{briefNote(highlights.attention).title}</h3><p>{briefNote(highlights.attention).evidence}</p><button className="text-button" onClick={()=>navigate(highlights.attention!)}>Voir les données <ArrowUpRight size={15}/></button></article>}
    {highlights.action&&<article className="panel simple-report-card"><span className="report-category">Ce que vous pourriez examiner</span><h3>{highlights.action.action}</h3><p>Une piste liée aux observations de cette période, sans supposer votre récupération ou votre technique.</p><button className="text-button" onClick={()=>navigate(highlights.action!)}>Examiner les données <ArrowUpRight size={15}/></button></article>}
    {!highlights.progress&&!highlights.attention&&<section className="panel"><p>Aucun changement de performance ou de volume ne peut être établi sur cette période. Les données disponibles restent accessibles dans le rapport complet.</p></section>}
  </section>;
}
