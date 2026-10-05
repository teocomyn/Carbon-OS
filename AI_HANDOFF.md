# Carbon OS — handoff du 5 octobre 2026

Branche de maintenance : `fix/security-and-beta-reliability`. `main` reste protégé ; publier par PR et fusion normale, sans contournement.

## Corrections

- Mise à jour cohérente Next/React et dépendances transitives ; CI bloque les vulnérabilités hautes/critiques des dépendances de production.
- Stockage navigateur résilient : mode temporaire signalé, anciens bilans valides migrés et totaux recalculés, entrées corrompues rejetées.
- Synchronisation sérialisée, invalidation des uploads à la suppression, tombstones pour les actions retirées, fusion atomique des préférences entre appareils.
- Quotas partagés en PostgreSQL, clé serveur limitée aux compteurs, HMAC des IP, fermeture de sécurité en cas de panne ; limites de taille des requêtes JSON.
- Erreurs réseau et suppression locale complète mieux gérées. Suppression du compte explicitement indisponible sans secret administrateur.
- Informations de confidentialité corrigées pour le feedback et le conseiller IA ; graphiques montés uniquement dans leur onglet visible, messages étroits adaptés.
- Dependabot : mises à jour ordinaires mensuelles, deux groupes npm maximum ; mises à jour de sécurité séparées.

## État externe vérifié pendant l’audit

- Supabase Carbon OS : région Paris, projet `hzkmqodnhcwthowufqqy`, RLS et politiques utilisateur actives sur les bilans/préférences, clés étrangères avec suppression en cascade.
- Les quatre nouvelles migrations sont appliquées, dont génération de suppression et upload transactionnel entre appareils. `SUPABASE_RATE_LIMIT_KEY` est configurée comme variable sensible Vercel de production ; disponible à partir du prochain déploiement.
- Aucun bilan utilisateur consulté, modifié ou supprimé. Aucun e-mail supprimé ni préférence de notification personnelle changée.

## Validation

- TypeScript, ESLint et 68 tests unitaires : réussis.
- 32 tests navigateur/Playwright/Axe réussis sur Chromium, dont parcours complet avec stockage refusé.
- Audit npm production : aucune vulnérabilité détectée lors de ce passage.
- Audit complet : une vulnérabilité `braces` sans correctif publié, propagée à cinq paquets de développement. Ne pas forcer une rétrogradation du framework pour masquer l’alerte.

## Configuration et tests restant à faire

- Ajouter `SUPABASE_SECRET_KEY` côté serveur Vercel, puis tester la suppression avec un compte de test dédié, jamais un compte réel.
- Compléter `LEGAL_*` et valider domaine canonique, SMTP, CAPTCHA, MFA administrateurs, sauvegardes/restauration et budget IA. Ces points ne sont pas confirmés par cet audit.
- Tester une connexion magique réelle, la synchronisation entre deux appareils et les cas de session expirée avec un compte de test autorisé.
- Passe manuelle iPhone Safari/Android Chrome, VoiceOver/TalkBack encore nécessaire : Chromium/Axe ne la remplace pas.
- Relever le résultat de CI, la fusion de la PR et le déploiement de production avant d’affirmer que les corrections sont en ligne.

Rapport : `docs/audit-2026-10-05.md`. Procédure de configuration : `docs/deployment.md`.
