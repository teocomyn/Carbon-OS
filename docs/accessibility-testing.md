# Vérification accessibilité et mobile

La CI contrôle automatiquement l’accueil, le questionnaire, le dashboard et le compte avec Axe aux formats 320, 360, 390 et 430 px, ainsi qu’en paysage. Elle bloque aussi les débordements horizontaux.

## Avant chaque diffusion bêta

1. Exécuter `npm run test:a11y`.
2. Sur iPhone Safari avec VoiceOver, parcourir chaque écran uniquement avec les gestes suivant/précédent et vérifier l’annonce des titres, champs, états sélectionnés et boutons.
3. Sur Android Chrome avec TalkBack, répéter le parcours et vérifier que chaque cible peut être activée sans toucher un élément voisin.
4. Brancher un clavier et réaliser tout le questionnaire avec `Tab`, `Maj + Tab`, `Entrée`, `Espace` et les flèches des sliders.
5. Vérifier que le focus reste toujours visible au-dessus du header et du footer, en portrait comme en paysage.
6. Contrôler les thèmes clair et sombre, le zoom texte à 200 % et la réduction des animations.

Les tests automatiques préviennent les régressions courantes. VoiceOver et TalkBack restent des validations manuelles indispensables avant une diffusion importante.
