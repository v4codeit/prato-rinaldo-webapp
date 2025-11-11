# Profile & Badges Tab Components

This directory contains the Profile & Badges tab implementation for the unified Bacheca dashboard. These components replace the old `/profile` page functionality.

## Components

### 1. ProfileSection (Main Container)
**File:** `profile-section.tsx` (42 lines)

Main wrapper component that orchestrates the profile tab layout.

**Props:**
- `userProfile`: UserProfile - User's profile data
- `badges`: UserBadgeWithDetails[] - User's earned badges
- `points`: PointsStats - Total points and level

**Layout:**
- Mobile: Single column, stacked sections
- Desktop: 2-column grid (form left, gamification right)

**Usage:**
```tsx
<ProfileSection
  userProfile={user}
  badges={badges}
  points={points}
/>
```

---

### 2. ProfileEditForm
**File:** `profile-edit-form.tsx` (246 lines)

Profile editing form with validation and server action integration.

**Features:**
- Name, bio, phone editing (email disabled/display only)
- Client-side validation
- useTransition for loading states
- Toast notifications
- Verification status badge
- Membership type display

**Validation:**
- Name: Required, min 2 chars
- Bio: Max 500 chars
- Phone: Optional, regex pattern `/^[+]?[\d\s()-]+$/`

**Server Action:** `updateProfile(formData)` from `@/app/actions/users`

---

### 3. LevelProgress
**File:** `level-progress.tsx` (147 lines)

Displays gamification level, points, and progress to next level.

**Features:**
- Large level display with trophy icon
- Animated progress bar
- Points breakdown
- Next level target calculation
- Tier-based color coding
- Educational content on how points work

**Level Calculation:**
- Level = floor(total points / 100)
- Progress % = (total points % 100)
- Points needed = 100 - (total points % 100)

**Tier Colors:**
- Level 1-2: Gray (Principiante)
- Level 3-4: Green (Intermedio)
- Level 5-9: Blue (Esperto)
- Level 10+: Purple (Leggenda)

---

### 4. BadgesDisplay
**File:** `badges-display.tsx` (155 lines)

Responsive grid of earned badges with metadata.

**Features:**
- Responsive grid (1/2/2 columns)
- Badge cards with icon, name, description
- Points value and earned date
- Empty state with motivational CTA
- Summary statistics footer

**Badge Card Data:**
- Icon (emoji)
- Name
- Description
- Points value (color-coded)
- Earned date (formatted Italian)

**Empty State:**
- Motivational message
- Quick action suggestions
- Sparkles icon placeholder

---

## Data Flow

```
page.tsx (Server Component)
  ├─ Fetch userProfile (getCurrentUser)
  ├─ Fetch badges (getUserBadges)
  └─ Fetch points (getUserPoints)
        ↓
  BachecaClient (Client Component)
        ↓
  ProfileSection
    ├─ ProfileEditForm → updateProfile() → revalidatePath
    ├─ LevelProgress (read-only)
    └─ BadgesDisplay (read-only)
```

## Server Actions

### updateProfile(formData: FormData)
**Location:** `app/actions/users.ts`

Updates user profile with validation.

**Revalidates:**
- `/profile`
- `/bacheca`

**Returns:**
- `{ success: true }` on success
- `{ error: string }` on failure

---

## Type Definitions

### UserProfile
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  membership_type?: string;
  created_at: string;
}
```

### UserBadgeWithDetails
```typescript
interface UserBadgeWithDetails {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: {
    id: string;
    name: string;
    description: string;
    icon: string; // emoji
    points: number;
    slug: string;
  };
}
```

### PointsStats
```typescript
interface PointsStats {
  total: number;
  level: number;
}
```

---

## Mobile Optimization

### Breakpoints
- `sm`: 640px (2-column badges grid)
- `lg`: 1024px (2-column main layout)

### Touch Optimization
- Larger touch targets (min 44x44px)
- Touch-friendly form inputs
- Mobile-first spacing

### Performance
- No images (emoji icons only)
- Minimal re-renders (form state isolated)
- Progressive enhancement

---

## Accessibility

### WCAG Compliance
- All form inputs have associated labels
- Error messages linked to inputs
- Keyboard navigation support
- Focus indicators preserved
- Semantic HTML structure

### ARIA
- Form validation errors announced
- Loading states communicated
- Badge count in descriptions

### Color Contrast
- All text meets AA standards
- Status colors have text alternatives
- Icons supplemented with text

---

## Future Enhancements

### Potential Additions
1. Avatar upload/cropping
2. Social links editing
3. Privacy settings
4. Account deletion
5. Badge showcase selection
6. Achievement notifications
7. Leaderboard integration
8. Badge share functionality

### Performance Optimizations
1. Optimistic updates for form
2. Badge virtualization (if 100+ badges)
3. Image optimization (if avatars added)
4. Skeleton loading states

---

## Testing Checklist

### Functional
- [ ] Form validation works correctly
- [ ] Profile updates save successfully
- [ ] Badges display correctly
- [ ] Level calculation accurate
- [ ] Empty states show properly
- [ ] Toast notifications appear

### UI/UX
- [ ] Mobile responsive layout
- [ ] Touch targets adequate size
- [ ] Loading states clear
- [ ] Error messages helpful
- [ ] Color contrast sufficient

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Focus management correct
- [ ] ARIA labels present

### Performance
- [ ] No unnecessary re-renders
- [ ] Form responds quickly
- [ ] No layout shift
- [ ] Images optimized (if added)

---

## Dependencies

### UI Components (shadcn/ui)
- Card, CardContent, CardDescription, CardHeader, CardTitle
- Button
- Input
- Textarea
- Label
- Badge
- Progress

### Icons (lucide-react)
- Trophy, TrendingUp, Target, Zap
- Award, Calendar, Star, Sparkles
- CheckCircle2, XCircle, Clock, Crown
- Loader2

### External Libraries
- sonner (toast notifications)
- React hooks (useState, useTransition)
- Next.js (useRouter)

---

## File Structure
```
components/bacheca/profile/
├── index.ts                  # Barrel exports
├── profile-section.tsx       # Main container (42 lines)
├── profile-edit-form.tsx     # Edit form (246 lines)
├── level-progress.tsx        # Level display (147 lines)
├── badges-display.tsx        # Badges grid (155 lines)
└── README.md                 # This file
```

**Total Lines:** 590 lines of TypeScript/TSX

---

## Integration

The ProfileSection is integrated into BachecaClient:

```tsx
// app/(private)/bacheca/bacheca-client.tsx
<TabsContent value="profilo">
  <ProfileSection
    userProfile={userProfile}
    badges={badges}
    points={points}
  />
</TabsContent>
```

Data is fetched in the parent server component (`page.tsx`) and passed down as props.
