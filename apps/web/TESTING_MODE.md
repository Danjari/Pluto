# Testing Mode for Daily Check-in

## Current Testing Setup

The daily check-in system is currently in **testing mode** with the following changes:

### 1. Hourly Reset Instead of Daily
- Check-ins reset every hour instead of at midnight
- Format: `YYYY-MM-DD-HH` instead of `YYYY-MM-DD`
- This allows you to test the modal multiple times

### 2. Manual Test Button
- Added "Test Check-in" button in the course header
- Modal doesn't auto-show on page load
- Click the button to test the check-in experience

### 3. Files Modified for Testing
- `app/api/courses/[id]/check-in/route.ts` - Both GET and POST endpoints
- `app/api/cron/send-reminders/route.ts` - Cron job logic
- `components/course/CourseViewer.tsx` - Added test button and disabled auto-show

## How to Test

1. **Open any course page**
2. **Click "Test Check-in" button** in the top right
3. **Try different moods** to see Pluto's responses
4. **Add notes** and submit
5. **See the check-in indicator** appear
6. **Wait for next hour** or modify the code to reset sooner

## Switch Back to Production

When you're done testing, make these changes:

### 1. Revert Date Format
In both `check-in/route.ts` files, change:
```typescript
// FROM (testing):
const today = new Date().toISOString().split('T')[0] + '-' + new Date().getHours();

// TO (production):
const today = new Date().toISOString().split('T')[0];
```

### 2. Revert Cron Job
In `cron/send-reminders/route.ts`, change:
```typescript
// FROM (testing):
const todayDateString = today.toISOString().split('T')[0] + '-' + today.getHours();

// TO (production):
const todayDateString = today.toISOString().split('T')[0];
```

### 3. Remove Test Button
In `CourseViewer.tsx`, remove the test button and uncomment auto-show:
```typescript
// Remove this button:
<Button variant="outline" onClick={() => setCheckInOpen(true)}>
  Test Check-in
</Button>

// Uncomment this:
if (!data.hasCheckedInToday) {
  setCheckInOpen(true);
}
```

## Quick Test Reset (Alternative)

If you want to test more frequently, you can change the reset interval:

```typescript
// Reset every 5 minutes:
const today = new Date().toISOString().split('T')[0] + '-' + Math.floor(new Date().getMinutes() / 5);

// Reset every minute:
const today = new Date().toISOString().split('T')[0] + '-' + new Date().getMinutes();
```
