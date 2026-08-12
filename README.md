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
- `src/lib/types.ts` — modèles TypeScript stricts

## Données et périmètre

La V1 cible la France. Les facteurs proviennent principalement d’Impact CO₂ / Base Empreinte ADEME, Agribalyse et du modèle open source Nos Gestes Climat 4.14.3. Ils sont figés dans une version locale afin que les anciens bilans restent reproductibles.

Certaines activités de mode rapide sont des estimations comportementales. Elles sont signalées dans l’interface et alimentent la fourchette d’incertitude. Les calculs critiques ne dépendent d’aucun LLM.

Les réponses sont conservées uniquement dans le stockage local du navigateur. Aucun compte ni backend n’est nécessaire pour effectuer un bilan.
