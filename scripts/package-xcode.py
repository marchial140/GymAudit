"""Crée un ZIP Xcode autonome après npm run ios:sync.
Usage: python3 scripts/package-xcode.py /chemin/Capacitor.xcframework.zip /chemin/Cordova.xcframework.zip
Archives officielles : https://github.com/ionic-team/capacitor-swift-pm/releases/tag/8.6.0
Les sommes SHA-256 viennent du Package.swift officiel au tag 8.6.0.
"""
from pathlib import Path
import hashlib, json, re, shutil, stat, sys, tempfile, zipfile

ROOT = Path(__file__).resolve().parents[1]
CHECKSUMS = {
    'Capacitor': 'df2b77a471b939ce2d1b954cf11247714154bb5f91fa94901d3547e8fda314ad',
    'Cordova': '150543647078664bd1e852574cec4a65d0a38c9d3c5a8a07740b17b07850d3f6',
}
assert len(sys.argv) == 3, 'Fournir les archives officielles Capacitor et Cordova 8.6.0.'
assert json.loads((ROOT/'node_modules/@capacitor/core/package.json').read_text())['version'] == '8.6.0'
with tempfile.TemporaryDirectory(prefix='gymaudit-xcode-') as tmp:
    target = Path(tmp)/'GymAudit'
    shutil.copytree(ROOT/'ios/App', target, ignore=shutil.ignore_patterns('xcuserdata', 'build', 'DerivedData', '.build', '.swiftpm', '.DS_Store'))
    shutil.copy2(ROOT/'ios/debug.xcconfig', target/'debug.xcconfig')
    (target/'App.xcodeproj').rename(target/'GymAudit.xcodeproj')
    project = target/'GymAudit.xcodeproj/project.pbxproj'
    project.write_text(project.read_text().replace('path = ../debug.xcconfig;', 'path = debug.xcconfig;'))
    schemes = target/'GymAudit.xcodeproj/xcshareddata/xcschemes'
    schemes.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT/'scripts/GymAudit.xcscheme', schemes/'GymAudit.xcscheme')
    packages = target/'NativePackages'
    runtime = packages/'capacitor-swift-pm'
    runtime.mkdir(parents=True)
    for (name, expected), archive in zip(CHECKSUMS.items(), sys.argv[1:]):
        archive = Path(archive)
        with archive.open('rb') as f:
            assert hashlib.file_digest(f, 'sha256').hexdigest() == expected, f'Somme incorrecte : {name}'
        with zipfile.ZipFile(archive) as z:
            for info in z.infolist():
                path = Path(info.filename)
                assert not path.is_absolute() and '..' not in path.parts
                assert not stat.S_ISLNK(info.external_attr >> 16)
                z.extract(info, runtime)
                if not info.is_dir():
                    (runtime/path).chmod((info.external_attr >> 16) & 0o777 or 0o644)
        assert (runtime/f'{name}.xcframework/Info.plist').is_file()
    (runtime/'Package.swift').write_text('''// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "capacitor-swift-pm", products: [
    .library(name: "Capacitor", targets: ["Capacitor"]),
    .library(name: "Cordova", targets: ["Cordova"])
], targets: [
    .binaryTarget(name: "Capacitor", path: "Capacitor.xcframework"),
    .binaryTarget(name: "Cordova", path: "Cordova.xcframework")
])
''')
    license_file = ROOT/'node_modules/@capacitor/core/LICENSE'
    assert license_file.is_file()
    shutil.copy2(license_file, runtime/'LICENSE')
    wrapper = target/'CapApp-SPM/Package.swift'
    text = wrapper.read_text().replace('.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.6.0")', '.package(name: "capacitor-swift-pm", path: "../NativePackages/capacitor-swift-pm")')
    versions = {}
    for plugin in ['clipboard', 'share', 'status-bar']:
        source = ROOT/'node_modules/@capacitor'/plugin
        destination = packages/plugin
        destination.mkdir()
        for filename in ['Package.swift', 'LICENSE', 'package.json']:
            shutil.copy2(source/filename, destination/filename)
        shutil.copytree(source/'ios', destination/'ios')
        manifest = destination/'Package.swift'
        manifest.write_text(re.sub(r'\.package\(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "[^"]+"\)', '.package(name: "capacitor-swift-pm", path: "../capacitor-swift-pm")', manifest.read_text()))
        text = text.replace(f'../../../node_modules/@capacitor/{plugin}', f'../NativePackages/{plugin}')
        versions[plugin] = json.loads((source/'package.json').read_text())['version']
    wrapper.write_text(text.replace('// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands', '// Copie autonome pour Xcode, produite par scripts/package-xcode.py'))
    for manifest in target.rglob('Package.swift'):
        assert 'node_modules' not in manifest.read_text() and '.package(url:' not in manifest.read_text()
        for path in re.findall(r'path: "([^"]+)"', manifest.read_text()):
            assert (manifest.parent/path).exists(), f'Chemin manquant : {manifest}: {path}'
    app = target/'App'
    assert (app/'public/index.html').is_file()
    assert (app/'capacitor.config.json').is_file()
    assert not json.loads((app/'capacitor.config.json').read_text()).get('server')
    assert not list(target.rglob('*.csv')), 'Aucun CSV ne doit être embarqué.'
    (target/'LIRE-MOI.txt').write_text('''GYMAUDIT — PROJET XCODE COMPLET

1. Ouvrir GymAudit.xcodeproj sur un Mac avec Xcode 26 ou plus récent.
2. Choisir le schéma GymAudit puis un simulateur iPhone, et cliquer sur Run (▶).
3. Pour un iPhone physique : choisir ton Team dans Signing & Capabilities,
   brancher l’iPhone, le sélectionner comme destination, puis Run.

Les fichiers compilés, plugins Swift et frameworks Capacitor 8.6.0 sont inclus.
Aucune commande npm et aucun téléchargement de package Swift ne sont nécessaires.
Xcode doit déjà disposer du SDK/simulateur nécessaire. La signature Apple reste
nécessaire pour ton téléphone. Ce ZIP ne contient pas d’IPA signé.

Le CSV personnel n’est pas inclus : l’importer depuis Fichiers dans l’app.
Les données restent locales. Le partage du rapport iOS produit du texte.

Ce projet a été assemblé et ses chemins vérifiés sous Linux. La compilation
Xcode et l’exécution sur iPhone n’ont pas pu être testées ici.

Cette archive contient une copie autonome des dépendances ; pour modifier
l’interface, utiliser les sources du dépôt GymAudit et régénérer cette archive.
''')
    (target/'DEPENDANCES.json').write_text(json.dumps({'capacitor': '8.6.0', 'plugins': versions, 'sha256_archives_officielles': CHECKSUMS}, indent=2)+'\n')
    output = ROOT/'downloads/GymAudit-iPhone-Xcode.zip'
    output.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as z:
        for path in sorted(target.rglob('*')):
            if path.is_file(): z.write(path, path.relative_to(target.parent))
    with zipfile.ZipFile(output) as z:
        assert z.testzip() is None
    print(f'{output}: {output.stat().st_size:,} octets ; toutes les dépendances Swift sont locales.')
