# Déploiement de Carbon OS

Le déploiement de référence utilise Vercel pour l’application et Supabase pour le compte facultatif.

## 1. Déployer l’application

1. Importer `teocomyn/Carbon-OS` dans Vercel.
2. Conserver le framework détecté `Next.js` et la commande `npm run build`.
3. Déployer une première fois sans Supabase pour valider le parcours local.
4. Définir `NEXT_PUBLIC_SITE_URL` avec l’URL canonique de production.

## 2. Activer Supabase

1. Créer un projet dans une région européenne adaptée aux utilisateurs.
2. Exécuter, dans l’ordre, les migrations de `supabase/migrations`.
3. Ajouter dans Vercel :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

4. Ajouter les URL de redirection dans Supabase Auth :

```text
http://localhost:3000/auth/callback
https://carbon-os-three.vercel.app/auth/callback
```

5. Tester la connexion, la fusion locale/distante, la déconnexion et la suppression complète du compte.

La clé `SUPABASE_SECRET_KEY` est un secret serveur. Elle ne doit jamais être préfixée par `NEXT_PUBLIC_`, journalisée ou exposée dans le navigateur.

## 3. Configurer l’anti-abus

1. Créer un widget Cloudflare Turnstile.
2. Déployer `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
3. Configurer la clé secrète dans Supabase Auth.
4. Activer le CAPTCHA côté Supabase seulement après avoir vérifié la clé publique en production.
5. Configurer un SMTP personnalisé avec le domaine de l’éditeur.

## 4. Compléter l’identité de l’éditeur

Définir avant toute ouverture commerciale :

```dotenv
LEGAL_PUBLISHER_NAME=
LEGAL_PUBLISHER_STATUS=
LEGAL_PUBLISHER_ADDRESS=
LEGAL_PUBLISHER_REGISTRATION=
LEGAL_CONTACT_EMAIL=
```

## 5. Vérifications avant production

```bash
npm ci
npm run check
```

Puis vérifier manuellement :

- landing, questionnaire, résultat et dashboard sur mobile ;
- calcul en mode rapide et précis ;
- reprise d’un brouillon ;
- historique et plan d’actions ;
- thème clair et sombre ;
- navigation clavier ;
- auth et synchronisation si Supabase est activé ;
- erreurs réseau et services facultatifs indisponibles ;
- pages légales, robots, sitemap et image Open Graph.

## 6. Checklist d’exploitation

- RLS active sur chaque table utilisateur.
- MFA active pour les comptes administrateurs Supabase et Vercel.
- Sauvegardes Supabase configurées et restauration testée.
- Secret scanning et push protection actifs sur GitHub.
- Alertes Dependabot et CodeQL traitées.
- Domaine, SMTP et mentions légales finalisés.
- Analytics vérifiés sans donnée interdite.
- Procédure de retour arrière Vercel connue.
