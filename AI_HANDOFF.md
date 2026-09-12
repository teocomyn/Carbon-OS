# Carbon OS — handoff

Branche : `feat/harden-assessment-engine` — PR https://github.com/teocomyn/Carbon-OS/pull/18

`main` est protégé : les changements passent par une pull request.

## Fait

- Empty states réels sur `/resultat` et `/dashboard`.
- Moteur 2026.09 : diesel distinct, long-courrier, train TGV/TER/mix, km précis, skip bœuf vegan.
- Feedback produit, skip-links, error boundary, changelog facteurs, rate limit partagé coach/sync.
- Potentiel dashboard recalculé ensemble (plus de somme de leviers qui se chevauchent).
- Tests Vitest étendus (answers, recommendations, plan, rate-limit, reassessment).

## Validation

- `npm run typecheck`, `npm test` (32), `npm run lint` : OK.
- Navigateur local : landing `#produit`, empty states, résultat 5,6 t, potentiel combiné −2,3 t, changelog, focus questionnaire.

## Bloqueurs

- `LEGAL_*`, domaine canonique et SMTP non renseignés : ne pas ouvrir les comptes en large.
- Rate limit in-process seulement (pas de store partagé).
- Passe VoiceOver / TalkBack manuelle encore due.

## Prochaine action

Renseigner l’identité éditeur et le domaine, puis lire le funnel Vercel (complétion, action, retour, `Retour produit`).
