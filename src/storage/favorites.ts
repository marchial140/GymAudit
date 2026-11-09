import {db} from './db';

export function normalizeFavorites(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((name): name is string => typeof name === 'string' && name.trim().length > 0))]
    : [];
}

// Une clé additive dans la table existante : aucune migration des séances.
// La transaction sérialise aussi les modifications provenant de deux vues.
export async function setFavorite(name: string, selected: boolean): Promise<string[]> {
  if (!name.trim()) throw new Error('Nom d’exercice vide.');
  return db.transaction('rw', db.state, async () => {
    const current = normalizeFavorites((await db.state.get('favorites'))?.value);
    const next = selected ? normalizeFavorites([...current, name]) : current.filter(item => item !== name);
    await db.state.put({id: 'favorites', value: next});
    return next;
  });
}
