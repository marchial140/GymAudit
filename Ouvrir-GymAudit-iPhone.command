#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
trap 'printf "\nUne étape a échoué. Consultez le message ci-dessus et IPHONE.md.\n"; read -r -p "Entrée pour fermer… " _' ERR
if [[ "$(uname -s)" != "Darwin" ]]; then
  printf 'Ce script doit être lancé sur un Mac avec Xcode. Consultez IPHONE.md.\n'
  exit 1
fi
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  printf 'Installez Node.js 24 depuis https://nodejs.org puis relancez ce script.\n'
  read -r -p 'Entrée pour fermer… ' _
  exit 1
fi
if ! xcodebuild -version >/dev/null 2>&1; then
  printf 'Installez et ouvrez Xcode, puis relancez ce script. Consultez IPHONE.md.\n'
  read -r -p 'Entrée pour fermer… ' _
  exit 1
fi
npm ci
npm run ios:sync
npm run ios:open
