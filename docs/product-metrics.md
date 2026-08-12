# Mesure produit Carbon OS

Vercel Web Analytics est activé sur le projet `carbon-os`. Le code centralise
les événements dans `src/lib/analytics.ts` afin d’empêcher l’envoi accidentel
de réponses détaillées ou d’identifiants personnels.

## Événements autorisés

- `Accueil consulté`
- `CTA bilan cliqué`
- `Questionnaire démarré`
- `Questionnaire abandonné` avec le chapitre uniquement
- `Questionnaire terminé` avec le mode et la durée arrondie à 5 secondes
- `Résultat consulté`
- `Action sélectionnée` avec l’identifiant public de l’action
- `Objectif défini`
- `Compte activé`
- `Second bilan réalisé` avec un délai classé en moins ou plus de 30 jours

Les paramètres d’URL sont supprimés avant l’envoi. Global Privacy Control,
Do Not Track et la préférence locale `va-disable=1` désactivent la mesure.

## Tableau de bord minimal

À calculer sur une même période dans Vercel Analytics :

1. Taux de démarrage = `Questionnaire démarré / Accueil consulté`.
2. Taux de complétion = `Questionnaire terminé / Questionnaire démarré`.
3. Temps médian = médiane de `dureeSecondes`, séparée par `mode`.
4. Adoption d’une action = `Action sélectionnée / Résultat consulté`.
5. Retour sous 30 jours = `Second bilan réalisé` filtré sur
   `delai=moins_30_jours / Questionnaire terminé`.

Objectifs initiaux : complétion supérieure à 70 %, mode rapide sous 5 minutes,
adoption d’une action supérieure à 40 %, second bilan sous 30 jours supérieur à
15 %. Le dernier indicateur mesure un retour depuis le même navigateur ou le
même compte, sans identifiant ajouté aux événements.

## Données interdites

Ne jamais ajouter aux événements : réponses détaillées, régime alimentaire,
consommations énergétiques, adresse e-mail, résultat carbone exact associé à
une personne, contenu libre ou identifiant utilisateur Supabase.
