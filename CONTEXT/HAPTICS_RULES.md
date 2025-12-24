# Haptics Usage Rules

## CRITICAL: Valid HapticFeedback Methods

The `HapticFeedback` utility in `src/utils/haptics.ts` provides the following methods:

- `HapticFeedback.light()` - Light feedback for button presses, toggles
- `HapticFeedback.medium()` - Medium feedback for card flips, selections
- `HapticFeedback.heavy()` - Heavy feedback for important actions, game events
- `HapticFeedback.success()` - Success feedback for correct answers, achievements
- `HapticFeedback.warning()` - Warning feedback for alerts, cautions
- `HapticFeedback.error()` - Error feedback for wrong answers, failures
- `HapticFeedback.selection()` - Selection feedback for UI interactions

## DO NOT USE

**NEVER** use the following non-existent methods:
- ❌ `HapticFeedback.impact()` - This method does NOT exist
- ❌ `HapticFeedback.impact('light')` - This method does NOT exist
- ❌ `HapticFeedback.impact('medium')` - This method does NOT exist
- ❌ `HapticFeedback.impact('heavy')` - This method does NOT exist

## Before Using Haptics

**ALWAYS** check `src/utils/haptics.ts` to verify the exact method names before using them in code.

If you need to add haptic feedback, use one of the valid methods listed above.

---

**Location of this instruction**: `/Users/mattdyor/SparksApp/CONTEXT/HAPTICS_RULES.md`

If you are ever told to check haptics rules, refer to this file.
