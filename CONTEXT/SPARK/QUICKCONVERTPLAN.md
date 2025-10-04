# Quick Convert Spark Plan

## Overview
A currency conversion tool that displays a conversion table with a large flag emoji, configurable exchange rate, and alternating row colors for better readability.

## Core Features

### Main Display
- **Large Flag Emoji**: Prominently displayed at the top of the page
- **Conversion Table**: Shows foreign currency amounts (left) vs USD amounts (right)
- **Alternating Row Colors**: Light/dark alternating background colors for table rows
- **Fixed USD Denominations**: Default to $1, $5, $10, $15, $20, $30, $40, $50, $60, $75, $100
- **2 Decimal Places**: Foreign currency amounts displayed to exactly 2 decimal places

### Settings Page
- **Exchange Rate Input**: Simple numeric input (e.g., 18.40)
- **USD Denominations Configuration**: 
  - Add new denominations
  - Remove existing denominations (with minimum of 1)
  - Reorder denominations
- **Country/Currency Selection**: Dropdown with country flags and currency symbols
- **Data Persistence**: Settings saved to spark-specific storage

### Data Structure
```typescript
interface QuickConvertData {
  exchangeRate: number;
  selectedCountry: string;
  usdDenominations: number[];
  lastUpdated: string;
}
```

### Currency/Country Mapping
- MXN (Mexico) - 🇲🇽 - $
- EUR (Europe) - 🇪🇺 - €
- GBP (UK) - 🇬🇧 - £
- JPY (Japan) - 🇯🇵 - ¥
- CAD (Canada) - 🇨🇦 - C$
- AUD (Australia) - 🇦🇺 - A$
- CHF (Switzerland) - 🇨🇭 - Fr
- CNY (China) - 🇨🇳 - ¥
- INR (India) - 🇮🇳 - ₹
- BRL (Brazil) - 🇧🇷 - R$

## User Experience Flow

### First Time Use
1. User opens Quick Convert spark
2. Modal appears asking for exchange rate
3. User enters rate (e.g., 18.40)
4. User selects country from dropdown
5. Conversion table displays with large flag emoji

### Subsequent Uses
1. User opens spark
2. Conversion table displays immediately with saved settings
3. User can access settings to modify exchange rate or denominations

### Settings Management
1. User taps settings button
2. Settings page opens with current configuration
3. User can modify:
   - Exchange rate
   - Country/currency
   - USD denominations (add/remove/reorder)
4. User saves changes
5. Main page updates with new settings

## Technical Implementation

### Components
- `QuickConvertSpark`: Main component with conversion table
- `QuickConvertSettings`: Settings page with configuration options
- `ExchangeRateModal`: Initial setup modal for first-time users

### State Management
- Use `useSparkStore` for data persistence
- Local state for UI interactions
- Validation for exchange rate input

### Styling
- Alternating row colors: light grey / white
- Large flag emoji (font size 48-64)
- Clean table layout with proper spacing
- Consistent with app theme

### Validation
- Exchange rate must be positive number
- At least one USD denomination required
- Numeric input validation for exchange rate

## Future Enhancements
- Multiple currency support (switch between different foreign currencies)
- Historical exchange rates
- Reverse conversion (foreign to USD)
- Export conversion table
- Custom denomination presets

## Success Metrics
- Quick setup (under 30 seconds for first use)
- Clear, readable conversion table
- Intuitive settings management
- Reliable data persistence
