# Spark Spark Plan

## Overview
**Spark Spark** is a meta-spark that allows users to submit ideas for new Sparks to be built. It acts as a product management interface where users define their vision, target customers, and potential pricing for their ideal Spark. Submitted ideas are saved to Firebase for review and potential implementation.

## Purpose
- Empower users to propose new Spark ideas
- Collect structured product requirements
- Validate market demand and willingness to pay
- Create a feedback loop for product development

## User Flow

### Page 1: Get Started (Introduction)
**UI:**
- Welcome card with title: "Spark Spark"
- Subtitle: "Create your own Spark"
- Description: "Do you want to be the Product Manager for your own spark? Where you define the product roadmap for your spark, and your engineering + AI team implements your vision and makes it available to users overnight?"
- Two buttons:
  - **Primary**: "Let's Get Started" (enabled)
  - **Secondary**: "Close Spark Spark" (enabled)

### Page 2: Spark Name
**UI:**
- Header: "Step 1 of 7"
- Card: "What do you want to call your Spark?"
- TextInput: Placeholder "e.g., Restaurant Finder, Study Timer, Habit Tracker"
- Validation: Required, minimum 3 characters
- Navigation:
  - **Back**: "Previous" (always enabled)
  - **Next**: "Next" (disabled until valid input)

### Page 3: Spark Description
**UI:**
- Header: "Step 2 of 7"
- Card: "Describe what your Spark will do, what problem it solves, and why it should exist."
- TextInput: Multiline, placeholder "Describe your Spark idea..."
- Validation: Required, minimum 50 characters
- Navigation:
  - **Back**: "Previous" (always enabled)
  - **Next**: "Next" (disabled until valid input)

### Page 4: Spark Customer
**UI:**
- Header: "Step 3 of 7"
- Card: "Describe who this spark is for -- who would use this spark?"
- TextInput: Multiline, placeholder "e.g., College students, Busy parents, Athletes"
- Validation: Required, minimum 20 characters
- Navigation:
  - **Back**: "Previous" (always enabled)
  - **Next**: "Next" (disabled until valid input)

### Page 5: Customer Payment
**UI:**
- Header: "Step 4 of 7"
- Card: "Would the Spark Customer pay to get this Spark? If so, how much?"
- TextInput: Multiline, placeholder "e.g., Yes, $2.99 for the full version, or No, it should be free"
- Validation: Required, minimum 10 characters
- Navigation:
  - **Back**: "Previous" (always enabled)
  - **Next**: "Next" (disabled until valid input)

### Page 6: Creation Payment
**UI:**
- Header: "Step 5 of 7"
- Card: "How much would you pay to create this Spark?"
- Dropdown Options:
  - "Nothing"
  - "About $100"
  - "Maybe $500-$1000"
  - "Over $1000"
- Default: "Nothing" (preselected)
- Validation: Required
- Navigation:
  - **Back**: "Previous" (always enabled)
  - **Next**: "Next" (disabled until selection made)

### Page 7: Contact Email
**UI:**
- Header: "Step 6 of 7"
- Card: "What is your email?"
- Description: "We'll use this to contact you about your Spark idea"
- TextInput: keyboardType="email", placeholder "your.email@example.com"
- Validation: Required, valid email format
- Navigation:
  - **Back**: "Previous" (always enabled)
  - **Next**: "Next" (disabled until valid email)

### Page 8: Review & Submit
**UI:**
- Header: "Step 7 of 7 - Review Your Spark"
- Card displaying all entered information:
  - **Spark Name**: [value]
  - **Description**: [value]
  - **Customer**: [value]
  - **Payment Model**: [value]
  - **Creation Payment**: [value]
  - **Email**: [value]
- Navigation:
  - **Back**: "Edit" (always enabled)
  - **Submit**: "Submit Spark Idea" (always enabled)

### Page 9: Success Confirmation
**UI:**
- Success icon/animation
- Title: "Thank You!"
- Message: "Your Spark idea has been submitted. We'll review it and get back to you at [email]."
- Button: "Done" (returns to Spark Spark home or closes)

## Technical Implementation

### Data Model (Firebase)
```typescript
interface SparkSubmission {
  id: string; // Auto-generated
  userId: string; // Current user's device ID
  timestamp: number; // Submission time
  sparkName: string;
  description: string;
  customer: string;
  customerPayment: string;
  creationPayment: string; // "Nothing" | "About $100" | "Maybe $500-$1000" | "Over $1000"
  email: string;
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'built';
  reviewNotes?: string;
}
```

### Firebase Collection
- Collection: `sparkSubmissions`
- Security: Authenticated users can create, read their own
- Admin can read all, update status

### State Management
```typescript
interface SparkSparkState {
  currentPage: number;
  formData: {
    sparkName: string;
    description: string;
    customer: string;
    customerPayment: string;
    creationPayment: string;
    email: string;
  };
  submitting: boolean;
  submitted: boolean;
}
```

### Navigation Logic
- `currentPage` (1-9) determines which screen to show
- Back button: `currentPage - 1` (minimum 1)
- Next button: `currentPage + 1` (maximum 9)
- Submit button triggers Firebase save and moves to confirmation

### Validation Rules
1. **Spark Name**: min 3 chars, required
2. **Description**: min 50 chars, required
3. **Customer**: min 20 chars, required
4. **Customer Payment**: min 10 chars, required
5. **Creation Payment**: Required, must be one of the dropdown options
6. **Email**: Valid email format, required

## Animations
- **Page Transitions**: Fade in/out (300ms)
- **Card Entrance**: Slide up from bottom with slight bounce
- **Button States**: Smooth opacity transitions on enabled/disabled
- **Success Confirmation**: Scale + fade animation with checkmark icon

## UI Components

### Card Component
```typescript
<View style={styles.card}>
  <Text style={styles.cardTitle}>{title}</Text>
  <Text style={styles.cardDescription}>{description}</Text>
  {children}
</View>
```

### Navigation Bar
```typescript
<View style={styles.navigationBar}>
  <TouchableOpacity 
    style={[styles.navButton, !canGoBack && styles.disabled]}
    onPress={handleBack}
    disabled={!canGoBack}
  >
    <Text style={styles.navButtonText}>Previous</Text>
  </TouchableOpacity>
  
  <Text style={styles.pageIndicator}>{currentPage} of 8</Text>
  
  <TouchableOpacity
    style={[styles.navButton, !canGoNext && styles.disabled]}
    onPress={handleNext}
    disabled={!canGoNext}
  >
    <Text style={styles.navButtonText}>Next</Text>
  </TouchableOpacity>
</View>
```

### Input Fields
- Large, clear labels
- Bold text styling
- Rounded corners
- Focus states with colored borders
- Validation messages

## Error Handling
- Network errors: Show retry option
- Validation errors: Inline messages below inputs
- Firebase errors: Alert with "Try Again" button

## Success States
- Loading indicator while submitting
- Confirmation screen with success animation
- Automatic navigation to confirmation page

## Accessibility
- Large touch targets (minimum 44x44)
- High contrast text
- Clear focus states
- Screen reader support for labels

## Future Enhancements
- Allow users to view their submitted Sparks
- Enable editing submissions before review
- Add image upload for visual mockups
- Community voting on submitted ideas
- Progress tracking for approved Sparks

