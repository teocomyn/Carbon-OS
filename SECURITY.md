# Politique de sécurité

## Versions prises en charge

Carbon OS est en bêta. Seule la version actuellement déployée depuis la branche `main` reçoit des correctifs de sécurité.

## Signaler une vulnérabilité

Ne pas ouvrir d’issue publique pour une vulnérabilité exploitable ou pour un secret exposé.

Utiliser le formulaire privé **Report a vulnerability** dans l’onglet [Security](https://github.com/teocomyn/Carbon-OS/security/advisories/new). Inclure si possible :

- le composant ou la route concernée ;
- les étapes de reproduction ;
- l’impact estimé ;
- une proposition de correction ;
- uniquement des données de test, jamais des données personnelles réelles.

Un premier accusé de réception est visé sous 72 heures. La priorité et le délai de correction dépendent de l’impact confirmé.

## Périmètre prioritaire

- authentification et sessions ;
- politiques Supabase Row Level Security ;
- suppression de compte ;
- exposition de secrets ;
- injection ou validation des entrées ;
- fuite de réponses détaillées vers Analytics ou le conseiller IA ;
- contournement des limitations de requêtes.

## Divulgation responsable

Merci de laisser le temps nécessaire à l’analyse et au déploiement d’un correctif avant toute publication. Aucun programme de bug bounty financier n’est proposé à ce stade.
