# Contribuer à Carbon OS

Merci de contribuer à Carbon OS. Les changements doivent préserver trois qualités : simplicité pour l’utilisateur, transparence du calcul et confidentialité par défaut.

## Avant de commencer

1. Rechercher une issue existante.
2. Ouvrir une issue pour un changement produit important.
3. Ne jamais publier de secret, de donnée utilisateur ou de capture contenant des informations personnelles.

## Installation

```bash
git clone https://github.com/teocomyn/Carbon-OS.git
cd Carbon-OS
npm ci
npm run dev
```

## Branches et commits

Utiliser une branche courte et descriptive :

```text
feat/action-reminders
fix/mobile-questionnaire
docs/calculation-method
```

Les commits suivent une forme inspirée de Conventional Commits :

```text
feat: add assessment comparison
fix: preserve slider value on mobile
docs: clarify Supabase setup
test: cover action plan limit
```

## Règles de développement

- Garder TypeScript en mode strict.
- Réutiliser les primitives de `src/components/ui`.
- Utiliser les tokens CSS existants avant d’ajouter une couleur arbitraire.
- Préserver clavier, focus visible, zones tactiles et réduction des animations.
- Ajouter un test à chaque changement du calcul, de la validation ou de la persistance.
- Documenter toute modification d’un facteur d’émission avec sa source et sa date.
- Ne jamais envoyer une réponse détaillée du questionnaire dans Analytics.

## Vérifications obligatoires

```bash
npm run check
```

Tester également le parcours concerné sur une largeur mobile et une largeur desktop.

## Pull request

Une pull request doit expliquer :

- le problème utilisateur ;
- la solution retenue ;
- les risques ou compromis ;
- les vérifications réalisées ;
- les captures avant/après pour un changement visuel.

Les changements de calcul, de sécurité ou de confidentialité demandent une revue particulièrement attentive.
