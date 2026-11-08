# GymAudit sur iPhone

GymAudit dispose maintenant d’un **projet iOS Capacitor**, qui embarque l’interface React dans une application iPhone/iPad. Le CSV, les calculs et le stockage restent sur l’appareil. Aucun serveur à lancer, aucune connexion Hevy ni clé API. Ce projet est distinct de « Copilot for Xcode ».

## Préparer et ouvrir sur ton Mac

Prérequis : **Node.js 24**, **Xcode 26 ou plus récent** et le support des simulateurs iOS installé dans Xcode. L’application cible **iOS 15 ou plus récent**. Xcode et les dépendances Swift doivent être téléchargés avant le premier lancement ; l’application elle-même n’a ensuite pas besoin d’un serveur.

1. Décompresse `GymAudit-iPhone.zip`.
2. Ouvre Terminal dans le dossier `GymAudit`.
3. Exécute :

```sh
npm ci
npm run ios:sync
npm run ios:open
```

Le script `Ouvrir-GymAudit-iPhone.command` fait ces étapes puis ouvre Xcode. Il vérifie les prérequis, sans installer de logiciels système. macOS peut demander de confirmer l’ouverture d’un script téléchargé ; les commandes Terminal ci-dessus permettent aussi de voir précisément chaque étape.

## Essayer dans le simulateur

Dans Xcode, ouvre **`ios/App/App.xcodeproj`**. Laisse Xcode résoudre les dépendances Swift Package Manager. Le schéma s’appelle **App**, le nom affiché sur le téléphone est **GymAudit**. Choisis un simulateur **iPhone** dans la liste des destinations, puis clique sur **▶ Run**. Aucune équipe de signature n’est nécessaire pour le simulateur.

Si tu vois uniquement « My Mac » et des iPhone marqués « mismatched platform », vérifie que tu as ouvert le projet GymAudit ci-dessus et choisi son schéma App, et non le projet Copilot for Xcode.

## Installer sur ton propre iPhone

1. Branche ton iPhone au Mac et accepte « Faire confiance » si demandé.
2. Dans Xcode, sélectionne le projet **App**, puis la cible **App → Signing & Capabilities**.
3. Active **Automatically manage signing** et choisis ton **Team** lié à ton compte Apple dans Xcode Settings → Accounts.
4. L’identifiant proposé est `app.gymaudit.ios`. Si Xcode le demande, remplace-le par un identifiant unique pour ton équipe, par exemple `com.tonnom.gymaudit`. Pour conserver ce choix lors d’une recréation du projet, ajuste aussi `appId` dans `capacitor.config.ts`.
5. Sélectionne ton **iPhone** comme destination, puis clique sur **▶ Run**.
6. Sur l’iPhone, active le **mode développeur** si iOS le demande (Réglages → Confidentialité et sécurité), puis autorise le profil développeur si nécessaire dans Réglages → Général → VPN et gestion de l’appareil.

Un compte Apple personnel peut permettre les essais sur ton appareil avec des limites de provisionnement, notamment une durée de validité limitée. Pour distribuer via TestFlight ou l’App Store, il faut l’adhésion Apple Developer, une signature et les démarches de publication Apple. Le ZIP n’est pas un fichier IPA signé et ne s’installe pas directement en le touchant sur l’iPhone.

## Importer ton historique

Transfère ton `workouts.csv` dans l’application **Fichiers** de l’iPhone. Dans GymAudit, touche **Importer un CSV**, puis choisis le fichier. Vérifie la prévisualisation et analyse-le. Les données du navigateur Web ne sont pas transférées automatiquement dans l’app iOS : réimporte ton export d’origine. Un nouvel import remplace l’ancien après confirmation, sans doublons.

Le bouton d’installation Web est masqué dans l’app iOS. Le rapport peut être partagé avec la feuille de partage native et copié via le presse-papiers iOS. L’export PDF par impression reste une fonction de la version Web ; l’app iOS partage un rapport texte. Les marges prennent en compte l’encoche et la barre d’accueil.

## Développer et vérifier

```sh
npm run test
npm run build          # version Web installable / PWA
npm run ios:sync       # reconstruit la version iOS et la copie dans le projet Xcode
npm run ios:open       # ouvre Xcode sur macOS
```

Toujours lancer `ios:sync` après une modification de l’interface, avant de recompiler dans Xcode. Le build iOS désactive le service worker et embarque ses fichiers ; il ne charge pas une URL distante. Ne jamais ajouter `workouts.csv` dans `public/` ou dans les ressources iOS.

**Validation dans l’environnement Linux :** tests TypeScript/Vitest, génération des ressources iOS et synchronisation Capacitor. **Non validé ici :** compilation Xcode, simulateur iOS, sélecteur Fichiers, partage natif et installation sur un iPhone physique. Ces vérifications nécessitent macOS/Xcode et, pour l’appareil physique, ta signature Apple. La suppression de l’application peut supprimer les données locales ; garde le CSV original.
