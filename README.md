# Reelverse

Projet de démonstration pour un jeu de collection autour du cinéma, conçu selon la spécification fournie.

## Stack

- Backend: Symfony, PHP, Doctrine ORM, PostgreSQL, Redis, Messenger, API Platform
- Frontend: React, TypeScript, Vite, React Router, TanStack Query, Zustand
- Infra: Docker / Docker Compose

## Architecture

```text
TMDB
  ↓
Import / Enrichissement
  ↓
PostgreSQL
  ↓
Symfony / API Platform
  ↓
React + TypeScript
```

## Structure du dépôt

```text
.
├── backend/           # Application Symfony + API Platform
├── frontend/          # Application React + TypeScript
├── docker-compose.yml # Services PostgreSQL, Redis, backend et frontend
├── README.md
└── .gitignore
```

## Démarrage rapide

1. Démarrer les services Docker :
   ```bash
   docker compose up --build
   ```
2. Backend API : http://localhost:8000/api
3. Frontend : http://localhost:5173

## MVP couvert

- collections par acteur, film et série
- calcul de rareté automatique
- navigation de graphe de cinéma
- API de consultation des cartes et collections
- interface React d'exploration de collections

## Points de conception

- PostgreSQL reste la source de vérité.
- Redis est prévu pour le cache et les tâches temporaires.
- Le frontend ne communique pas directement avec la base.
- Le backend expose les ressources via API Platform et les points de terminaison métier.
