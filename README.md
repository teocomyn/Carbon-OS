# Carbon OS

Un tableau de bord carbone personnel premium : mesurer, comprendre, simuler et prioriser les actions qui réduisent réellement une empreinte individuelle.

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000).

## Vérifications

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Architecture

- `src/app` — routes Next.js (landing, questionnaire, dashboard)
- `src/components` — interface et composants produit
- `src/data/emission-factors.ts` — registre versionné des facteurs
- `src/lib/calculator.ts` — moteur déterministe `activité × facteur`
- `src/lib/recommendations.ts` — scénarios et priorisation
- `src/lib/history.ts` — historique local, fusion et suivi de progression
- `src/lib/action-plan.ts` — plan personnel limité à trois actions
- `src/lib/analytics.ts` — liste fermée des événements produit non sensibles
- `src/lib/supabase` — sessions SSR et synchronisation facultative
- `src/lib/types.ts` — modèles TypeScript stricts
- `supabase/migrations` — schéma PostgreSQL et politiques Row Level Security

La définition des cinq indicateurs produit et les règles de confidentialité de
la mesure sont documentées dans `docs/product-metrics.md`.

## Données et périmètre

La V1 cible la France. Les facteurs proviennent principalement d’Impact CO₂ / Base Empreinte ADEME, Agribalyse et du modèle open source Nos Gestes Climat 4.14.3. Ils sont figés dans une version locale afin que les anciens bilans restent reproductibles.

Certaines activités de mode rapide sont des estimations comportementales. Elles sont signalées dans l’interface et alimentent la fourchette d’incertitude. Les calculs critiques ne dépendent d’aucun LLM.

Sans compte, les réponses et l’historique restent dans le stockage local du
navigateur. Aucun backend n’est nécessaire pour effectuer ou comparer des
bilans.

## Activer le compte facultatif

1. Créer un projet Supabase dans une région adaptée aux utilisateurs.
2. Exécuter la migration `supabase/migrations/20260812170000_user_beta.sql` dans
   le SQL Editor Supabase.
3. Copier `.env.example` vers `.env.local` et renseigner l’URL, la clé
   publiable et la clé serveur `sb_secret_`.
4. Dans Supabase Auth, ajouter les URL de redirection locale et de production :
   `http://localhost:3000/auth/callback` et
   `https://carbon-os-three.vercel.app/auth/callback`.
5. Ajouter les mêmes variables dans Vercel, puis redéployer.

Pour activer la protection anti-bot, créer un widget Cloudflare Turnstile,
ajouter `NEXT_PUBLIC_TURNSTILE_SITE_KEY` au projet, puis activer Turnstile dans
Supabase Auth avec sa clé secrète. Ne jamais activer le CAPTCHA côté Supabase
avant que la clé publique soit déployée, sinon les liens magiques seront bloqués.

La clé `sb_secret_` reste strictement côté serveur et sert uniquement à la
suppression définitive d’un compte. L’ancienne clé `service_role` reste acceptée
pour compatibilité. Les lectures et écritures courantes utilisent la session de
l’utilisateur et les politiques RLS.

## Finaliser les mentions légales

Renseigner dans Vercel `LEGAL_PUBLISHER_NAME`, `LEGAL_PUBLISHER_STATUS`,
`LEGAL_PUBLISHER_ADDRESS`, `LEGAL_PUBLISHER_REGISTRATION` si applicable, et
`LEGAL_CONTACT_EMAIL`. Tant que ces valeurs sont absentes, l’interface indique
explicitement que l’identité de l’éditeur reste à finaliser.
