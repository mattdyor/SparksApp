# SparksApp Codebase Overview

## 🏗️ **Architecture & Technology Stack**

### **Core Technologies**
- **React Native + Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe JavaScript for better development experience
- **React Navigation**: Navigation system with tab and stack navigators
- **Zustand**: Lightweight state management
- **AsyncStorage**: Local data persistence
- **Styled Components**: CSS-in-JS styling (minimal usage)

### **Key Dependencies**
- `expo-notifications`: Push notifications and scheduling
- `expo-speech`: Text-to-speech functionality
- `expo-haptics`: Tactile feedback
- `expo-camera`: Camera integration for FoodCam and other photo features
- `expo-av`: Audio/video playback for soundboard and media features
- `react-native-safe-area-context`: Handle device safe areas
- `@react-native-async-storage/async-storage`: Local data persistence

## 📁 **Project Structure**

```
src/
├── components/          # Reusable UI components
│   ├── SparkRegistry.tsx   # Central spark registration
│   └── BaseSpark.tsx       # Base spark component
├── contexts/            # React context providers
│   └── ThemeContext.tsx    # Dark/light theme management
├── navigation/          # Navigation configuration
│   └── AppNavigator.tsx    # Main navigation setup
├── screens/            # Main application screens
│   ├── SparkSelectionScreen.tsx  # "My Sparks" screen
│   ├── MarketplaceScreen.tsx     # Available sparks browser
│   ├── SettingsScreen.tsx        # App settings
│   └── SparkScreen.tsx           # Individual spark renderer
├── sparks/             # Individual spark implementations (24+ sparks)
│   ├── BusinessSpark.tsx        # Business simulation game
│   ├── BuzzyBingoSpark.tsx      # Buzzword bingo game
│   ├── CardScoreSpark.tsx       # Card game scorekeeping
│   ├── ComingUpSpark.tsx        # Track birthdays and anniversaries
│   ├── FinalClockSpark.tsx      # Mortality countdown tracker
│   ├── FlashcardsSpark.tsx      # Spanish language learning
│   ├── FoodCamSpark.tsx         # Visual food diary with photos
│   ├── GolfBrainSpark.tsx       # Golf round tracking and analysis
│   ├── GolfWisdomSpark/         # Golf wisdom reading app
│   ├── MinuteMinderSpark.tsx    # Activity timer and tracking
│   ├── PackingListSpark.tsx     # Travel packing lists
│   ├── QuickConvertSpark.tsx    # Currency conversion tool
│   ├── ShareSparks.tsx          # Share app with friends
│   ├── ShortSaverSpark.tsx      # YouTube Shorts organizer
│   ├── SongSaverSpark.tsx      # Spotify tracks organizer
│   ├── SoundboardSpark.tsx      # Custom sound clips recorder
│   ├── SpanishFriendSpark.tsx   # Spanish conversation practice
│   ├── SpanishReaderSpark.tsx  # Bilingual reading practice
│   ├── SparkSpark.tsx           # Spark idea submission wizard
│   ├── SpinnerSpark.tsx         # Decision-making wheel
│   ├── TeeTimeTimerSpark.tsx    # Golf prep routine timer
│   ├── TodoSpark.tsx            # Task management
│   ├── ToviewSpark.tsx          # Media tracking (movies, books, shows)
│   ├── TripStorySpark.tsx       # Trip planning and journaling
│   ├── TripSurveySpark.tsx      # Collaborative trip planning
│   └── WeightTrackerSpark.tsx   # Weight tracking and goals
├── store/              # State management
│   ├── index.ts             # Store exports
│   ├── appStore.ts          # App-wide preferences
│   └── sparkStore.ts        # Spark data and progress
├── types/              # TypeScript definitions
│   ├── navigation.ts        # Navigation type definitions
│   └── spark.ts            # Spark interface definitions
└── utils/              # Utility functions
    ├── haptics.ts          # Haptic feedback wrapper
    └── notifications.ts    # Notification service
```

## 🧩 **Core Architecture Concepts**

### **1. Spark System**
The app is built around **"Sparks"** - self-contained mini-applications/activities:

```typescript
interface BaseSpark {
  metadata: SparkMetadata;  // Title, description, icon, category
  component: React.ComponentType<SparkProps>;
}
```

**SparkRegistry.tsx** acts as the central registry where all sparks are registered and can be discovered.

### **2. Navigation Architecture**
```
TabNavigator (AppNavigator)
├── MySparks Tab → MySparksStack
│   ├── MySparksList (SparkSelectionScreen)
│   └── Spark (SparkScreen) → Renders individual spark
├── Marketplace Tab → MarketplaceStack  
│   ├── MarketplaceList (MarketplaceScreen)
│   └── Spark (SparkScreen) → Same spark renderer
└── Settings Tab (SettingsScreen)
```

**Key Feature**: Custom navigation hiding - tab bar disappears when inside sparks for immersive experience.

### **3. State Management Pattern**
**Zustand stores** handle different data domains:

- **`appStore.ts`**: User preferences (theme, notifications, haptics)
- **`sparkStore.ts`**: Spark data, user progress, collections

```typescript
// Spark-specific data storage pattern
const { getSparkData, setSparkData } = useSparkStore();
const savedData = getSparkData('spark-id');
setSparkData('spark-id', { user: 'data' });
```

### **4. Spark Implementation Pattern**
Each spark follows a consistent interface:

```typescript
interface SparkProps {
  showSettings?: boolean;      // Settings modal control
  onCloseSettings?: () => void;
  onStateChange?: (state: any) => void;
  onComplete?: (result: any) => void;
}
```

**Sparks are responsible for**:
- Their own UI and logic
- Data persistence via `useSparkStore`
- Settings management
- Progress tracking
- Completion callbacks

## 🔄 **Data Flow & Key Interactions**

### **Spark Lifecycle**
1. **Discovery**: User browses sparks in Marketplace
2. **Addition**: User adds spark to their collection
3. **Launch**: User opens spark from "My Sparks"
4. **Execution**: Spark renders with custom navigation
5. **Persistence**: Spark saves progress via store
6. **Completion**: Optional completion callback triggers

### **Navigation Flow**
```
User in TabNavigator → Selects Spark → SparkScreen
→ SparkScreen renders spark component → Custom navigation appears
→ Tab bar hides → Immersive spark experience
→ User exits → Returns to tab navigation
```

### **Theme System**
- **ThemeContext** provides colors and theme state
- **Automatic switching** between light/dark modes
- **Safe area handling** for modern iOS devices (Dynamic Island)

## 📱 **Current Sparks Overview**

The app currently includes **24+ sparks** across multiple categories:

### **Productivity**
| Spark | Purpose | Key Features |
|-------|---------|--------------|
| **TodoSpark** | Task management | Due dates, completion tracking, relative date display |
| **PackingListSpark** | Travel packing | Customizable items, progress tracking |
| **MinuteMinderSpark** | Activity tracking | Start times, countdown timers, daily activity log |
| **TripSurveySpark** | Collaborative trip planning | Group input, decision-making, survey collection |
| **ComingUpSpark** | Event tracking | Birthdays, anniversaries, countdown to big days |

### **Education**
| Spark | Purpose | Key Features |
|-------|---------|--------------|
| **FlashcardsSpark** | Spanish learning | 50 travel phrases, TTS, session tracking, randomization |
| **SpanishFriendSpark** | Spanish conversation | Practice with Ana and Miguel, conversation scenarios |
| **SpanishReaderSpark** | Bilingual reading | Interleaved English/Spanish text, reading practice |

### **Media & Entertainment**
| Spark | Purpose | Key Features |
|-------|---------|--------------|
| **ToviewSpark** | Media tracking | Movies, books, shows with view dates, categories, providers |
| **ShortSaverSpark** | YouTube organizer | Save and organize YouTube Shorts with categories |
| **SongSaverSpark** | Spotify organizer | Save and organize Spotify tracks with categories |
| **SoundboardSpark** | Sound clips | Record and play custom sound clips with categories |

### **Golf**
| Spark | Purpose | Key Features |
|-------|---------|--------------|
| **GolfBrainSpark** | Golf tracking | Round analysis, shot tracking, course management |
| **TeeTimeTimerSpark** | Golf prep | Routine timer, countdown to tee time |
| **GolfWisdomSpark** | Golf wisdom | Daily quotes and wisdom from Tam O'Shanter |

### **Health & Wellness**
| Spark | Purpose | Key Features |
|-------|---------|--------------|
| **FoodCamSpark** | Food diary | Photo timeline, camera integration, visual tracking |
| **WeightTrackerSpark** | Weight tracking | Goal setting, progress visualization, weight history |
| **FinalClockSpark** | Mortality awareness | Countdown to projected death date based on actuarial data |

### **Utility**
| Spark | Purpose | Key Features |
|-------|---------|--------------|
| **SpinnerSpark** | Decision making | Customizable wheel with options |
| **QuickConvertSpark** | Currency conversion | Configurable exchange rates, denominations |
| **CardScoreSpark** | Card game scoring | Fast, simple scorekeeping for card games |
| **ShareSparks** | App sharing | Share the Sparks app with friends |

### **Travel**
| Spark | Purpose | Key Features |
|-------|---------|--------------|
| **TripStorySpark** | Trip journaling | Plan trips, add photos, remember experiences |

### **Games**
| Spark | Purpose | Key Features |
|-------|---------|--------------|
| **BusinessSpark** | Business simulation | Strategic decision-making game |
| **BuzzyBingoSpark** | Buzzword bingo | Mark squares as you hear tech terms |

### **Community**
| Spark | Purpose | Key Features |
|-------|---------|--------------|
| **SparkSpark** | Spark submission | Submit your own Spark idea, become a product manager |

## 🔧 **Key Technical Features**

### **Notifications System**
- **Daily reminders** at 8 AM to check new sparks
- **Expo Notifications** with proper permissions
- **Cross-platform** scheduling (iOS/Android)
- **Settings toggle** for user control

### **Audio & Haptics**
- **Text-to-speech** for Spanish pronunciation (FlashcardsSpark)
- **Haptic feedback** throughout the app for better UX
- **Audio settings** user can control

### **Data Persistence**
- **AsyncStorage** via Zustand persistence
- **Per-spark data** storage pattern
- **Settings and progress** automatically saved
- **Export functionality** (basic implementation)

## 🚀 **Getting Started as a New Developer**

### **1. Key Entry Points**
- **App.tsx**: Application root with theme and navigation setup
- **AppNavigator.tsx**: Main navigation structure
- **SparkRegistry.tsx**: Add new sparks here

### **2. Adding a New Spark**
1. Create component in `src/sparks/NewSpark.tsx`
2. Implement `SparkProps` interface
3. Add to `SparkRegistry.tsx`
4. Test via Marketplace

### **3. Common Patterns**
- **State**: Use `useSparkStore()` for data persistence
- **Styling**: Follow existing `StyleSheet.create()` patterns with `colors` from theme
- **Navigation**: Sparks auto-hide tab bar, use provided navigation props
- **Feedback**: Use `HapticFeedback.light()` for interactions

### **4. Development Commands**
```bash
npm start          # Start development server
npx expo start     # Expo development server
npx expo start --ios    # iOS simulator
npx expo start --android # Android emulator
```
Instructions for developers are available in the `CONTRIBUTING.md` file. 

## 📋 **Current Status & Known Issues**



### **Important Development Reminders**
- ⚠️ **ALWAYS CHECK CURRENT DIRECTORY**: When encountering `ConfigError: The expected package.json path: /path/to/ios/package.json does not exist`, immediately run `pwd` to verify you're in the correct directory (`/Users/mattdyor/SparksApp`). This error typically means you're in the wrong folder (often the `ios/` subdirectory instead of the project root).

### **Architecture Strengths**
- **Modular spark system** - easy to add new functionality
- **Consistent data patterns** - predictable state management
- **Cross-platform** - single codebase for iOS/Android
- **Type safety** - TypeScript throughout

### **Recent Improvements**
- **Code Quality**: Removed unused imports (e.g., StyleTokens from ToviewSpark)
- **Spark Registry**: Expanded to 24+ sparks across multiple categories
- **Settings System**: Comprehensive settings components for consistent UX
- **Theme System**: Full dark/light mode support across all sparks

### **Areas for Future Enhancement**
- **Refactor Sparks** - Reduce duplicated code and increase use of Spark Components (e.g., shared notification logic like Tee Time Timer/Minute Minder, sortable lists, camera interop)
- **Testing framework** - No tests currently implemented
- **Performance optimization** - Large spark registry could be lazy-loaded
- **Offline capability** - Currently requires online for notifications
- **Analytics** - No usage tracking implemented
- **Code cleanup** - Continue removing unused imports and dependencies

This architecture provides a solid foundation for a mini-app ecosystem where each "spark" is a focused, useful tool or activity for users.
