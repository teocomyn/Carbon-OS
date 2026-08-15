<div align="center">
  <a href="https://carbon-os-three.vercel.app">
    <img src="https://carbon-os-three.vercel.app/icon" alt="Logo Carbon OS" width="76" height="76" />
  </a>

  <h1>CARBON OS</h1>

  <p><strong>Comprendre son empreinte carbone. Choisir trois actions réalistes. Mesurer ses progrès.</strong></p>

  <p>
    <a href="https://carbon-os-three.vercel.app"><strong>Tester l’application</strong></a>
    ·
    <a href="./docs/architecture.md">Architecture</a>
    ·
    <a href="./CONTRIBUTING.md">Contribuer</a>
    ·
    <a href="./SECURITY.md">Sécurité</a>
  </p>

  <p>
    <a href="https://github.com/teocomyn/Carbon-OS/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/teocomyn/Carbon-OS/ci.yml?branch=main&style=flat-square&label=CI" alt="Statut CI" /></a>
    <a href="https://carbon-os-three.vercel.app"><img src="https://img.shields.io/website?url=https%3A%2F%2Fcarbon-os-three.vercel.app&style=flat-square&label=production" alt="Statut de la production" /></a>
    <img src="https://img.shields.io/badge/Next.js-16-111111?style=flat-square&logo=nextdotjs" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript strict" />
    <img src="https://img.shields.io/badge/privacy-local--first-236C50?style=flat-square" alt="Local-first" />
  </p>
</div>

![Aperçu de Carbon OS](https://carbon-os-three.vercel.app/opengraph-image)

> [!NOTE]
> Carbon OS est actuellement en **bêta publique**. Les résultats sont des estimations pédagogiques, pas un audit carbone réglementaire.

## Pourquoi Carbon OS ?

Les calculateurs carbone donnent souvent un chiffre puis s’arrêtent là. Carbon OS transforme ce résultat en un parcours simple : mesurer, comprendre les catégories qui comptent, construire un plan limité à trois actions et suivre l’évolution entre deux bilans.

| Mesurer                        | Comprendre                                      | Agir                                                   | Progresser                                      |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Questionnaire rapide ou précis | Calcul déterministe et fourchette d’incertitude | Recommandations personnalisées et plan à trois actions | Historique, comparaison et récit de progression |

### Principes produit

- **Simple avant tout** — un bilan rapide prend environ quatre minutes.
- **Privé par défaut** — le calcul et l’historique fonctionnent sans compte, dans le navigateur.
- **Transparent** — chaque ligne de calcul relie une activité à un facteur versionné.
- **Non culpabilisant** — aucune compétition publique, aucun score social et aucun badge artificiel.
- **Actionnable** — l’utilisateur repart avec un petit plan réaliste, pas une liste infinie.

## Fonctionnalités

- Questionnaire adaptatif en mode rapide ou précis.
- Résultat par catégorie, niveau de confiance et fourchette indicative.
- Dashboard responsive avec explications et simulations.
- Plan personnel limité à trois actions : à essayer, en cours ou réalisée.
- Progression entre plusieurs bilans et invitation à recalculer.
- Compte facultatif par lien magique et synchronisation Supabase protégée par RLS.
- Conseiller carbone conversationnel basé uniquement sur un contexte agrégé.
- Mesure produit anonyme avec Vercel Web Analytics, sans réponses détaillées.
- Thème clair/sombre, navigation clavier et expérience mobile dédiée.

## Stack technique

| Couche            | Technologies                                       |
| ----------------- | -------------------------------------------------- |
| Application       | Next.js 16, React 19, TypeScript strict            |
| Interface         | Tailwind CSS 4, Radix UI, Motion, Recharts, Lucide |
| Données locales   | Web Storage, moteur de calcul déterministe         |
| Compte facultatif | Supabase Auth, PostgreSQL, Row Level Security      |
| IA                | Vercel AI SDK et AI Gateway                        |
| Produit           | Vercel Web Analytics                               |
| Qualité           | ESLint, Vitest, TypeScript, GitHub Actions, CodeQL |
| Déploiement       | Vercel                                             |

## Démarrage rapide

### Prérequis

- Node.js 22
- npm 10 ou supérieur

```bash
git clone https://github.com/teocomyn/Carbon-OS.git
cd Carbon-OS
npm ci
npm run dev
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000). Le questionnaire, le calcul, le résultat et l’historique local fonctionnent sans service externe.

### Services facultatifs

```bash
cp .env.example .env.local
```

Renseigner uniquement les intégrations nécessaires :

| Variables                                                          | Usage                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Connexion et synchronisation facultatives                   |
| `SUPABASE_SECRET_KEY`                                              | Suppression définitive d’un compte, côté serveur uniquement |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                                   | Protection anti-robot de l’authentification                 |
| `LEGAL_*`                                                          | Identité publique de l’éditeur                              |

Les étapes complètes sont dans le [guide de déploiement](./docs/deployment.md).

## Scripts

| Commande            | Rôle                                      |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Démarrer le serveur local                 |
| `npm run typecheck` | Vérifier les types TypeScript             |
| `npm run lint`      | Exécuter ESLint                           |
| `npm test`          | Lancer les tests Vitest                   |
| `npm run build`     | Produire le build Next.js                 |
| `npm run check`     | Exécuter toutes les vérifications locales |

## Architecture

```text
src/app/                   Routes, API et métadonnées Next.js
src/components/            Interfaces du produit
src/components/ui/         Primitives visuelles réutilisables
src/data/                  Facteurs d’émission et valeurs par défaut
src/lib/calculator.ts      Moteur activité × facteur
src/lib/recommendations.ts Scénarios et priorisation
src/lib/history.ts         Historique local et fusion
src/lib/action-plan.ts     Plan personnel limité à trois actions
src/lib/supabase/          Sessions SSR et synchronisation facultative
supabase/migrations/       Schéma PostgreSQL et politiques RLS
docs/                      Architecture, déploiement et mesure produit
```

Voir [docs/architecture.md](./docs/architecture.md) pour les flux de données et les frontières de confidentialité.

## Calcul et sources

La V1 cible la France. Les facteurs proviennent principalement d’Impact CO₂ / Base Empreinte ADEME, d’Agribalyse et du modèle open source Nos Gestes Climat. Ils sont figés localement afin de conserver des bilans reproductibles.

```text
activité utilisateur × facteur versionné = kg CO₂e
```

Les calculs critiques ne dépendent d’aucun modèle génératif. Le conseiller IA reçoit uniquement un résumé agrégé du bilan et ne modifie jamais le résultat.

## Confidentialité

- Aucun compte n’est nécessaire pour calculer un bilan.
- Sans compte, les réponses et l’historique restent dans le navigateur.
- Avec un compte, chaque utilisateur ne peut accéder qu’à ses lignes grâce aux politiques RLS.
- Les événements Analytics excluent les réponses, l’e-mail et le résultat exact associé à une personne.
- Global Privacy Control, Do Not Track et la préférence locale `va-disable=1` désactivent la mesure.

La liste fermée des événements est documentée dans [docs/product-metrics.md](./docs/product-metrics.md).

## Documentation

- [Architecture et flux de données](./docs/architecture.md)
- [Déploiement et configuration](./docs/deployment.md)
- [Roadmap produit](./docs/roadmap.md)
- [Mesure produit respectueuse de la vie privée](./docs/product-metrics.md)
- [Guide de contribution](./CONTRIBUTING.md)
- [Politique de sécurité](./SECURITY.md)

## Contribuer

Les retours de bêta, rapports de bugs et propositions UX sont les bienvenus. Lire [CONTRIBUTING.md](./CONTRIBUTING.md) avant d’ouvrir une issue ou une pull request.

## Statut de la licence

Ce dépôt public n’accorde pas encore de licence open source explicite. En l’absence de fichier de licence, tous les droits restent réservés à l’auteur. Une licence pourra être ajoutée après décision explicite du propriétaire du projet.

---

<div align="center">
  Conçu en France par <a href="https://github.com/teocomyn">Teo Comyn</a> · <a href="https://carbon-os-three.vercel.app">carbon-os-three.vercel.app</a>
</div>
