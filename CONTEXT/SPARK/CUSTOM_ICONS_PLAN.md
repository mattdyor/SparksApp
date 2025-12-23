# Custom Spark Icons Implementation Plan

## Objective
Allow Sparks to use custom image assets as icons instead of just emojis, specifically for the "Wolverine" Tripod Spark.

## Strategy
Add an optional `iconImage` field to the `SparkMetadata` interface. UI components will prioritize rendering `iconImage` if present; otherwise, they will fall back to the existing `icon` (emoji) string.

## 1. Schema Update
- [ ] Modify `src/types/spark.ts`:
  ```typescript
  export interface SparkMetadata {
    // ...
    icon: string; // Keep as required fallback
    iconImage?: any; // ImageSourcePropType (number or object)
    // ...
  }
  ```

## 2. Component Updates
Update the following screens/components to handle the new field:
- [ ] `src/screens/MarketplaceScreen.tsx`
- [ ] `src/screens/SparkSelectionScreen.tsx` (My Sparks)
- [ ] Any other location using `spark.metadata.icon` (e.g. `NotificationBadge` parent?)

**Logic:**
```tsx
{spark.metadata.iconImage ? (
  <Image source={spark.metadata.iconImage} style={{width: 32, height: 32}} />
) : (
  <Text style={styles.sparkIcon}>{spark.metadata.icon}</Text>
)}
```

## 3. Data Update
- [ ] Update `src/components/sparkRegistryData.tsx`:
  - Import the new asset `wolverine_icon.png`.
  - Add `iconImage: require('../../assets/wolverine_icon.png')` to `tripod-spark` metadata.

## 4. Verification
- [ ] Verify Tripod Spark shows the Wolverine image in Marketplace.
- [ ] Verify Tripod Spark shows the Wolverine image in My Sparks.
- [ ] Verify other sparks still show emojis.
