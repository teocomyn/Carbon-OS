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

### Limites partagées entre les instances Vercel

Exécuter les migrations `20261005140000`, `20261005141000` et `20261005143000` après les migrations initiales. Elles ajoutent les compteurs privés et la fusion atomique des plans, sans retirer les politiques RLS utilisateur.

La production doit disposer de `SUPABASE_RATE_LIMIT_KEY`, une clé serveur aléatoire distincte de la clé administrateur. Générer au moins 32 octets aléatoires, enregistrer uniquement son SHA-256 dans `public.rate_limit_server_keys.key_hash` via une session d’administration Supabase, puis ajouter la clé d’origine comme variable sensible dans Vercel. Ne jamais copier cette clé dans Git, une capture d’écran ou un message.

Le RPC limité ne permet que de consommer des compteurs anti-abus ; cette clé ne permet pas de lire les bilans ni de supprimer des utilisateurs. Les identifiants des compteurs sont des HMAC d’adresses IP, pas les adresses en clair. Les compteurs expirés sont nettoyés lors des requêtes suivantes.

Sur Vercel, un magasin indisponible ou non configuré renvoie `503` : la protection n’est pas silencieusement désactivée. Un quota dépassé renvoie `429` et `Retry-After`. Le compteur mémoire reste réservé au développement local sans configuration serveur.

Pour une rotation : enregistrer le nouveau hash, mettre à jour la variable sensible et redéployer, vérifier le service, puis révoquer l’ancien hash. Pour les previews connectées à Supabase, configurer aussi leur clé serveur ; ne pas exposer une production entière à des branches non fiables.

La suppression complète du compte exige **en plus** `SUPABASE_SECRET_KEY`. Sans cette clé administrateur serveur, le bouton est désactivé et l’interface explique la limitation. Le secret anti-abus n’est pas un substitut.

### Connexion par lien magique

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
npm run test:a11y
npm audit --omit=dev --audit-level=high
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
