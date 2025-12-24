# Archive Sparks Plan

## Overview
This document describes how to archive sparks in the Sparks app. Archived sparks are removed from the app bundle (reducing APK/IPA size) by simply removing them from the registry. Their code remains in the codebase for future reference or re-activation.

## How Archiving Works

### Architecture
1. **Remove from Registry** (`src/components/sparkRegistryData.tsx`): Delete the spark entry and import
2. **Metro Tree-Shaking**: Unused imports are automatically excluded from production builds
3. **Code Preservation**: Spark files remain in `src/sparks/` directory

### Benefits
- ✅ Code stays in GitHub/codebase for version control
- ✅ Code is **NOT included** in production APK/IPA (reduces app size)
- ✅ No import errors or build failures
- ✅ Easy to re-activate by adding back to registry
- ✅ Simple and straightforward

## How to Archive a Spark

### Step 1: Remove from Main Registry

1. Open `src/components/sparkRegistryData.tsx`
2. **Delete** the import statement for the spark (e.g., `import { BusinessSpark } from '../sparks/BusinessSpark';`)
3. **Delete** the entire spark entry from the `sparkRegistry` object
4. Save the file

**Example**:
```typescript
// REMOVE THIS:
import { BusinessSpark } from '../sparks/BusinessSpark';

// REMOVE THIS:
'business-sim': {
  metadata: {
    id: 'business-sim',
    title: 'Business Simulator',
    // ... rest of metadata
  },
  component: BusinessSpark,
},
```

### Step 2: Rebuild

Metro's tree-shaking will automatically exclude the spark from the bundle since it's no longer imported.

```bash
cd /Users/mattdyor/SparksApp
rm -rf android ios
npm install
npx expo prebuild --clean
cd android && ./gradlew clean && cd ..
npx expo run:android --variant release
```

### Step 3: Verify

1. **Development**: Archived spark should not appear in Discover/Marketplace
2. **Build**: Run production build and verify app size is reduced
3. **Code**: Spark code files remain in `src/sparks/` directory

## How to Un-Archive a Spark

1. Open `src/components/sparkRegistryData.tsx`
2. **Add** the import statement back (e.g., `import { BusinessSpark } from '../sparks/BusinessSpark';`)
3. **Add** the spark entry back into the `sparkRegistry` object
4. Rebuild the app

## Currently Archived Sparks

- **Business Simulator** (`business-sim`): Archived 2025-12-23
  - Reason: Not actively used, reducing app size
  - Location: `src/sparks/BusinessSpark.tsx`
  - Can be re-activated if needed

## Technical Details

### Metro Bundler Tree-Shaking
Metro's tree-shaking removes unused imports during production builds. Since archived sparks are not imported anywhere in the app, they are automatically excluded from the bundle.

### File Structure
```
src/
├── components/
│   └── sparkRegistryData.tsx      # Main registry (production sparks)
└── sparks/
    ├── BusinessSpark.tsx          # Archived spark code (stays in repo)
    └── ...other sparks
```

## Best Practices

1. **Document Why**: Always note the reason for archiving in this document
2. **Keep Code Clean**: Don't delete archived spark files from the codebase
3. **Test Before Archiving**: Ensure the spark isn't used elsewhere in the app
4. **Version Control**: Commit archive changes with clear commit messages
5. **Monitor Size**: Track app size changes after archiving

## Related Files
- Main Registry: [sparkRegistryData.tsx](file:///Users/mattdyor/SparksApp/src/components/sparkRegistryData.tsx)
- Spark Type Definitions: [src/types/spark.ts](file:///Users/mattdyor/SparksApp/src/types/spark.ts)

---

**Note**: We previously tried creating an `archivedSparks.ts` file, but this caused runtime errors because the imports were still being evaluated. The simpler approach of just removing from the registry works perfectly with Metro's tree-shaking.
