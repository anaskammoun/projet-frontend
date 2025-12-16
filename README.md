# Gestion Déchets – Frontend (Vue 3 + Vite)

## Prérequis
- Node.js 18+
- npm

## Installation & lancement
```bash
npm install
npm run dev
```

Par défaut, le front appelle l'API backend. Ajuste l'URL dans `src/services/api.js` si nécessaire.

## Backend (référence rapide)
Dans `../Projet_Backend_Hassen` :
```bash
mvn spring-boot:run
```
Prérequis : JDK 17+, Maven.

## Structure (résumé)
- `src/pages` : pages principales (tournées, véhicules, employés, points)
- `src/components` : composants communs (sidebar, navbar, selects, cartes)
- `src/services` : appels API centralisés
