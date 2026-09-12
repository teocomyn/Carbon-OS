# Carbon OS — contexte stable

Produit local-first pour estimer une empreinte personnelle en France, comprendre cinq postes et suivre trois actions. Bêta publique, isolée du reste du portfolio (pas de Vertical Network, pas de `site_id`).

## Décisions

- Le calcul déterministe vit dans le navigateur. Aucun LLM ne produit le total.
- Compte facultatif (magic link + RLS). Sans bilan réel, `/resultat` et `/dashboard` n’affichent pas de profil d’exemple.
- Facteurs figés : `FACTOR_VERSION`. Un changement recalcule l’historique à la lecture.
- Analytics : liste fermée dans `src/lib/analytics.ts`. Pas de réponses, e-mail, ni total personnel.
- Plan actif limité à trois actions. Les simulations combinées recalculent le moteur, elles ne somment pas les leviers.

## Hors scope volontaire

Classements publics, badges culpabilisants, calcul critique délégué à un modèle génératif, collecte perso non nécessaire.
