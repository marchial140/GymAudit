import type {ExerciseDefinition,Muscle,Category} from '../domain/types';
// Règles conservatrices : un nom inconnu reste à classifier. Les corrections priment.
export function classify(name:string):ExerciseDefinition {
 const n=name.toLowerCase();let category:Category='strength',primary:Muscle[]=[],secondary:Muscle[]=[];let classified=true;
 if(/cycling|spinning|running|walking|swimming|boxing|football|elliptical|jump rope|stair machine|sled push/.test(n))category='cardio';
 else if(/stretch|warm up|massage|compression|90\/90|hip cars|hip airplaine|dead hang/.test(n))category='mobility';
 else if(/clamshell|band walks|side-lying|lateral leg raises|tke|step down|stabilty|décélération|leg extensions hold|hip flexor/.test(n))category='rehab';
 else if(/close grip|jm press|triceps|skullcrusher|seated dip/.test(n)){primary=['Triceps'];secondary=/dip|close grip/.test(n)?['Pectoraux','Deltoïdes avant']:[];}
 else if(/bench press|chest press/.test(n)){primary=['Pectoraux'];secondary=['Triceps','Deltoïdes avant'];}
 else if(/chest fly|crossover/.test(n)){primary=['Pectoraux'];}
 else if(/lateral raise/.test(n)){primary=['Deltoïdes latéraux'];}
 else if(/reverse fly/.test(n)){primary=['Deltoïdes arrière'];secondary=['Haut du dos'];}
 else if(/shoulder press/.test(n)){primary=['Deltoïdes avant'];secondary=['Triceps','Deltoïdes latéraux'];}
 else if(/curl/.test(n)&&!/leg|hamstring/.test(n)){primary=['Biceps'];}
 else if(/leg curl|hamstring/.test(n)){primary=['Ischio-jambiers'];}
 else if(/straight arm lat/.test(n)){primary=['Dos / grand dorsal'];}
 else if(/pulldown|pull up|muscle up/.test(n)){primary=['Dos / grand dorsal'];secondary=['Biceps','Haut du dos'];}
 else if(/row/.test(n)&&!/roller/.test(n)){primary=['Haut du dos','Dos / grand dorsal'];secondary=['Biceps','Deltoïdes arrière'];}
 else if(/shrug/.test(n)){primary=['Haut du dos'];}
 else if(/romanian deadlift/.test(n)){primary=['Ischio-jambiers','Fessiers'];secondary=['Lombaires'];}
 else if(/squat|lunge|leg press/.test(n)){primary=['Quadriceps'];secondary=['Fessiers'];}
 else if(/leg extension/.test(n)){primary=['Quadriceps'];}
 else if(/glute|hip thrust|hip abduction/.test(n)){primary=['Fessiers'];}
 else if(/hip adduction|tibialis|wrist roller|farmers walk/.test(n)){primary=['Autres'];}
 else if(/calf/.test(n)){primary=['Mollets'];}
 else if(/crunch|ab |sit up|leg raise|heel taps|plank|side bend/.test(n)){primary=['Abdominaux'];}
 else if(/back extension/.test(n)){primary=['Lombaires'];secondary=['Fessiers','Ischio-jambiers'];}
 else if(/triceps dip/.test(n)){primary=['Triceps'];secondary=['Pectoraux'];}
 else {category='other';classified=false;}
 return {name,category,primary,secondary,classified,bodyweight:/bodyweight|pull up|muscle up|triceps dip|suspension/.test(n)};
}
export const categoryLabels:Record<Category,string>={strength:'Musculation',cardio:'Cardio',mobility:'Mobilité',rehab:'Réadaptation',other:'À classifier'};
export function makeCatalog(names:string[],overrides:Record<string,ExerciseDefinition>={}){return Object.fromEntries(names.map(n=>[n,overrides[n]||classify(n)]));}
