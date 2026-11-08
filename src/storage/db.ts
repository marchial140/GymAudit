import Dexie,{type Table} from 'dexie';
import type {Dataset,Preferences,ExerciseDefinition} from '../domain/types';
class GymDB extends Dexie {state!:Table<{id:string;value:unknown},string>;constructor(){super('GymAudit');this.version(1).stores({state:'id'});}}
export const db=new GymDB();
export interface Saved {dataset:Dataset|null;preferences:Preferences;catalog:Record<string,ExerciseDefinition>}
export async function readState<T>(id:string):Promise<T|undefined>{return (await db.state.get(id))?.value as T|undefined;}
export async function saveState(id:string,value:unknown){await db.state.put({id,value});}
