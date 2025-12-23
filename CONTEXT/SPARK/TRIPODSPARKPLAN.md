# TRIPODSPARKPLAN: Wolverine Tripod Sales Spark

## Objective
Create a dedicated Spark to showcase and sell the "Wolverine" tripod. The experience should be premium, featuring the provided product image, color selection, address collection, and a native Apple Pay / Google Pay checkout experience.

## Technical Strategy
**Payment Provider**: We will use **Stripe** (`@stripe/stripe-react-native`) instead of RevenueCat.
*Reason*: RevenueCat and In-App Purchases (IAP) effectively prohibit the sale of physical goods (like a tripod). Stripe is the industry standard for physical goods payments on mobile and supports native Apple Pay and Google Pay sheets.

## 1. Dependencies
- `@stripe/stripe-react-native`: For native Apple Pay / Google Pay integration.
- `expo-linking`: For deep linking back after payment (if needed).

## 2. Data Model
**Product**:
- Name: "The Wolverine"
- Description: "The ultimate grass-mounting tripod for your swing analysis. Compact, durable, and ready for the range."
- Price: $5.00 USD (Shipping included)
- Colors: Orange, Black (based on image)
- Image: `assets/wolverine_tripod.jpg` (Available locally)

**Order**:
- Selected Color
- Shipping Address (Name, Line 1, City, State, Zip)
- Payment Status

## 3. UI/UX Flow
### A. Product Showcase (Main View)
- **Hero Image**: Large, high-quality display of the Wolverine tripod.
- **Title & marketing copy**: "Mount Up. Swing Well.", "Record your swing on the golf course."
- **Color Selection**: Interactive color swatches (Orange, Black).
- **Sticky Footer**: "Add to Bag - $5.00" button.

### B. Purchase Flow (Modal)
1.  **Shipping Info**: Simple form for address (Name, Street, City, ZIP). Auto-fill from device if possible (or keep simple for demo).
2.  **Payment Method**:
    - "Pay with Apple Pay" / "Pay with Google Pay" button (Stripe Platform Pay).
    - Fallback: "Pay with Card" button if native pay isn't set up.
3.  **Success State**:
    - Animation (e.g., Lottie checkmark or simple celebration).
    - "Your Wolverine is on the way!" message.

## 4. Implementation Steps

### Phase 1: Setup & Assets
- [ ] Install `@stripe/stripe-react-native`.
- [ ] Configure `StripeProvider` in `App.tsx` (or wrap the Spark).
- [ ] Ensure `wolverine_tripod.jpg` is correctly placed in assets.

### Phase 2: Components
- [ ] Create `TripodSpark.tsx` (Main entry).
- [ ] Create `ProductShowcase.tsx` (Hero, content, color picker).
- [ ] Create `AddressForm.tsx` (Shipping inputs).
- [ ] Create `CheckoutPayment.tsx` (Stripe integration).

### Phase 3: Integration
- [ ] Register `TripodSpark` in `SparkRegistry`.
- [ ] Add "Wolverine Tripod" as a discoverable Spark or promo item.

## 5. Mock vs Real
Since we are "testing mechanisms":
- We will set up the **UI** for Stripe.
- **Note**: Actual payment processing requires a valid Stripe Publishable Key. If one isn't provided, we will implement a "Mock" mode where the "Pay" button simulates a successful API call so the user can see the full flow without a real credit card charge.

## 6. Integration
- Add to `src/sparks/TripodSpark.tsx`.
