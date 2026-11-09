# GymAudit

**V1.1 :** [nouveautés, règles d’interprétation et vérifications](V1.1.md). Les calculs et le stockage V1 sont conservés ; le ZIP Xcode autonome contient la nouvelle interface.

**Téléchargement Xcode complet, sans npm :** [GymAudit-iPhone-Xcode.zip](https://github.com/marchial140/GymAudit/raw/refs/heads/main/downloads/GymAudit-iPhone-Xcode.zip). Décompresser et ouvrir **`GymAudit/GymAudit.xcodeproj`** dans Xcode, choisir le schéma **GymAudit** et un simulateur iPhone, puis ▶. Le ZIP inclut les fichiers compilés, les plugins et les frameworks Capacitor ; la signature Apple reste à configurer pour un iPhone physique.

**Version iPhone :** le projet Xcode est disponible dans `ios/App/App.xcodeproj`. Voir [le guide iPhone](IPHONE.md) pour le simulateur, la signature et l’installation sur ton appareil.

Application Web en français pour analyser un export Hevy **entièrement dans le navigateur**. React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide, Papa Parse, date-fns, Dexie et Vitest. Aucun backend, compte, service IA ou clé API.

## Installation et lancement

Node.js 22.12+ ou 24 LTS recommandé (validé avec Node 24).

```sh
npm install
npm run dev
```

Ouvrir l’adresse affichée par Vite. Importer `workouts.csv` via le bouton ou par glisser-déposer, vérifier la prévisualisation puis choisir **Analyser mon entraînement**. Si une période est vide, sélectionner **Tout l’historique**. La démo est séparée, explicitement fictive, et remplacée intégralement par tout import réel.

```sh
npm run build
npm run test
```

Le dossier `dist/` contient le site statique à héberger. Garder la même origine (protocole, domaine et port) pour retrouver IndexedDB. L’application fonctionne sans API ; l’hébergement doit servir ses fichiers JS/CSS. La version de production est une PWA installable, avec manifeste, icônes et service worker. Après un premier chargement complet, son interface peut être rouverte hors connexion. Le CSV et IndexedDB ne sont jamais placés dans le cache réseau.

## Fonctions

- Import des 14 colonnes Hevy, BOM, ordre variable, séparateur détecté, champs CSV cités, valeurs absentes ou invalides et avertissements. Dates anglaises explicitement parsées en heure locale, compatibles Safari.
- Prévisualisation avec lignes source, séances, exercices, dates, types d’activité et qualité RPE. Un nouvel import **remplace** l’ancien après confirmation ; aucune fusion et aucune suppression arbitraire de séries identiques.
- Tableau de bord : périodes 7/28/90 jours, historique ou dates personnalisées, séances et séries hebdomadaires, temps déduit des horaires, répartition musculaire et historique navigable.
- Volume : direct, indirect et équivalent, stimulation par jours distincts, moyenne hebdomadaire, comparaison avec la période précédente, détail des exercices contributeurs et chronologie du muscle.
- Progression propre à chaque exercice : recherche, charge, répétitions à charge donnée, charge à répétitions comparables, volume de charge, e1RM estimé, records, tendances et séries sources (y compris activités non musculaires).
- Rapport déterministe avec chiffres, interprétations prudentes, pistes d’action et liens vers les données. Impression/PDF par le navigateur et copie texte.
- Classification modifiable, coefficients réglables, unités lb/kg, thèmes clair/sombre, stockage IndexedDB, suppression totale des données. Navigation mobile et fenêtres utilisables au clavier.

## Calculs et hypothèses

Une séance est la combinaison exacte `(start_time, end_time, title)`. Chaque ligne valide est conservée. Les dates de séances déterminent les périodes ; les semaines commencent le lundi. Les moyennes couvrent tous les jours sélectionnés, même sans séance, et la comparaison utilise la période immédiatement précédente de même durée (28 jours pour le filtre 28 jours).

Une série comptabilisable nécessite un exercice classé musculation, des reps positives entières et un type `normal`, `failure` ou `dropset`. `warmup`, cardio, mobilité, réadaptation et exercices inconnus sont exclus des volumes musculaires. Une série directe par muscle principal ; coefficient indirect de 0,5 par muscle secondaire par défaut, sans double comptage d’un muscle principal. Les séries équivalentes appliquent aussi le coefficient dropset (0,5 par défaut). Les directes brutes ne sont pas pondérées. Une même série peut contribuer à plusieurs muscles : leur somme dépasse alors le nombre de séries physiques. Les jours stimulés comprennent les contributions principales et secondaires.

Volume de charge = charge × reps, uniquement pour un même exercice, avec charge positive et reps valides. Aucune comparaison de tonnage entre machines ou variantes. 1 lb = 0,45359237 kg ; les haltères ne sont jamais automatiquement doublés. Le temps cumulé est déduit des horaires de séance, pas du temps actif.

Epley : `charge × (1 + reps / 30)` pour 2 à 12 reps et charge positive. Exclu des exercices au poids du corps ou lestés signalés dans le catalogue, du cardio et des échauffements. Un e1RM de machine reste propre à cette machine ; il n’est jamais un 1RM mesuré. Les tendances comparent la charge moyenne à un nombre de reps paramétrable (8 ±1 par défaut) des 4 dernières séances comparables aux 4 précédentes. Au-delà de +2 % : progression ; sous −2 % : diminution ; entre les deux : stabilité possible. Plateau **potentiel** : au moins 4 séances comparables et aucune des 3 dernières au-dessus de la première de plus de 2 %. Cela ne démontre ni fatigue ni absence de progrès.

Les règles conservatrices du catalogue classent les noms reconnaissables ; les noms ambigus restent **À classifier** et sont exclus du volume. Toute classification est une hypothèse révisable depuis les paramètres. RPE manquant = `null` ; `normal` ne signifie pas échec. Les rapports ne permettent aucun diagnostic de santé, de blessure ou de récupération.

## Vie privée

Aucun contenu du CSV n’est transmis au réseau. Les calculs, imports et données sont locaux, dans IndexedDB. Aucune police distante, télémétrie ou API tierce. Le CSV réel n’est ni versionné ni inclus dans `public/`, les fixtures ou le bundle. `.gitignore` protège `workouts.csv` ; ne jamais ajouter un export personnel sous un autre nom au dépôt. Conserver une copie de son CSV original : effacer le stockage du navigateur efface l’historique local. Un navigateur partagé donne accès aux données à ses utilisateurs.

## Validation

Les tests couvrent parsing, dates, valeurs vides, regroupement, exclusions, coefficients, conversion, e1RM, comparaisons, seuils, rapport et persistance IndexedDB. Le test de référence est optionnel : fournir un chemin externe au dépôt, sans copier le fichier dans les fixtures.

```sh
GYMAUDIT_TEST_CSV=/chemin/prive/workouts.csv npm run test
```

Contrôles de référence vérifiés : **7 860 lignes**, **488 séances**, **140 exercices**, du **2 janvier 2025 au 7 novembre 2026** ; normal 7 790, dropset 66, failure 3, warmup 1 ; **46 RPE renseignés**. Ces valeurs sont des assertions de test, jamais des statistiques codées dans l’application.

Un parcours Chromium a aussi validé : import réel depuis l’interface, cinq pages, origine du volume, persistance au rechargement, réimport sans doublons, mobile à 390 px sans débordement de page et aucune requête POST/PUT du contenu. Les tests navigateur ont été exécutés avec un outil externe au projet ; ils ne nécessitent aucune dépendance navigateur pour l’utilisation.

## Structure

```text
src/
  main.tsx          # interface et navigation
  style.css         # thème, composants, mobile et impression
  domain/           # modèles et calculs purs
  imports/          # parsing et validation Hevy
  data/             # classification initiale et démo fictive
  reports/          # moteur de rapport déterministe
  storage/          # IndexedDB avec Dexie
  tests/            # tests Vitest et persistance
```

## Limites de cette V1

Pas de fusion multi-fichiers, de comptes, de synchronisation, d’IA ni de diagnostic. Les cibles personnelles de volume, l’export CSV d’agrégats et la heatmap sont des options non réalisées. Les alias et tags avancés ne disposent pas d’éditeur. Le catalogue repose sur des règles de noms modifiables : les exercices ambigus doivent être vérifiés. Les rapports proposent des pistes conservatrices plutôt qu’un programme d’entraînement. L’historique du tableau de bord montre les 30 séances les plus récentes ; la page progression donne toutes les séries de l’exercice sur la période. Les données locales ne migrent pas automatiquement entre appareils ou origines Web.

## Installer l’application

Cliquer sur **Installer GymAudit** dans la barre supérieure. Chrome/Edge affichent leur dialogue natif lorsque le site est éligible. Sinon, le bouton explique les étapes manuelles (Safari : Partager → Sur l’écran d’accueil). L’application doit être servie en HTTPS, ou sur localhost pour le développement, et ouverte dans un navigateur complet. Un aperçu intégré peut empêcher l’installation.

Le manifeste et le cache hors connexion sont générés par `npm run build`. Pour tester localement la version installable :

```sh
npm run build
npx vite preview --host 127.0.0.1
```

Le site doit être hébergé à la racine du domaine. L’installation n’est ni un compte ni une synchronisation : selon l’appareil et le navigateur, l’application installée peut utiliser un stockage distinct et demander de réimporter le CSV. Les mises à jour du service worker s’activent lorsque les fenêtres utilisant l’ancienne version sont fermées.
