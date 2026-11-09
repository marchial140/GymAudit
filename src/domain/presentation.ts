import {compare,number as n,type AuditNote,type Metric} from './experience';
import {toUnit} from './analysis';
import type {ExerciseProgress,Preferences} from './types';

export function briefNote(note: AuditNote) {
  return {
    title: note.title.replace('Progression mesurée :', 'Charge comparable en hausse :')
      .replace('Diminution mesurée :', 'Charge comparable en baisse :')
      .replace('Nouvel e1RM estimé :', 'Record estimé sur une répétition :'),
    evidence: note.evidence.replace(', 4 dernières séances comparables contre les 4 précédentes.', ' · 4 dernières séances vs 4 précédentes.'),
  };
}

export function reportHighlights(notes: AuditNote[]) {
  const progress = notes.find(note => note.group === 'progress');
  const attention = notes.find(note => note.group === 'attention' && !['activity', 'quality'].includes(note.key));
  const action = attention || progress;
  return {progress, attention, action};
}

export function favoritePerformance(rows: ExerciseProgress[], prefs: Preferences) {
  // Le choix est explicite : aucune variation de reps entre charges différentes.
  const metric: Metric | null = rows.some(row => row.comparable !== null) ? 'comparable'
    : rows.some(row => row.e1rm !== null) ? 'e1rm'
    : rows.some(row => row.weight > 0) ? 'weight' : null;
  const label = metric === 'comparable' ? `Charge à ${prefs.repTarget} ± ${prefs.tolerance} reps`
    : metric === 'e1rm' ? 'Charge estimée sur une répétition' : 'Charge enregistrée par séance';
  const valid = metric ? rows.filter(row => row[metric] !== null && (metric !== 'weight' || row.weight > 0)) : [];
  const first = valid[0], last = valid.at(-1);
  const change = first && last && first.workoutId !== last.workoutId
    ? compare(toUnit(last[metric!]!, prefs.unit), toUnit(first[metric!]!, prefs.unit)) : null;
  const latest = rows.at(-1);
  const latestText = last && metric
    ? `${n(toUnit(last[metric]!, prefs.unit))} ${prefs.unit}`
    : latest ? `${latest.reps} reps · charge non comparable` : 'Aucune performance exploitable sur la période';
  return {metric, label: metric ? label : 'Performance observée', latest, lastMeasured: last, latestText, change,
    points: valid.map(row => toUnit(row[metric!]!, prefs.unit)), count: valid.length};
}
