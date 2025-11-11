# Bacheca Unification - Phase 1 Analysis

## Current State Analysis

### `/bacheca` (app/(private)/bacheca/page.tsx)
**Type:** Server Component ✅
**Current Features:**
- Welcome section with user avatar and verification status
- 6 quick link cards (Eventi, Marketplace, Agorà, Community Pro, Risorse, Profilo)
- Recent activity section (latest 3 events + 3 marketplace items)
- Fetches: user profile, events, marketplace items

**Strengths:**
- Already a server component (good for performance)
- Clean, simple layout
- Shows recent community activity

**Limitations:**
- No tab system
- Limited user-specific data (only shows public events/items)
- No management functionality for user's own content

---

### `/profile` (app/(authenticated)/profile/page.tsx)
**Type:** Client Component ⚠️
**Current Features:**
- 3 tabs: Profile, Badges, Activity
- Profile tab: Edit form (name, bio, phone), verification status display
- Badges tab: Level progress bar, badges grid with points
- Activity tab: User's marketplace items, professional profile

**Strengths:**
- Tab-based organization (good UX pattern)
- Complete user profile editing
- Gamification display (badges, points, levels)

**Limitations:**
- Client component (all data fetched client-side)
- Limited to profile management only
- No advanced filtering or search
- No quick actions (edit, delete, mark sold)

---

## Data Fetching Functions Available

### ✅ All Required Functions Exist:

**Marketplace:**
- `getMyItems()` - app/actions/marketplace.ts
- Returns user's marketplace items with status

**Proposals:**
- `getMyProposals()` - app/actions/proposals.ts
- Returns user's Agorà proposals with category

**Professional:**
- `getMyProfessionalProfile()` - app/actions/service-profiles.ts
- Returns user's professional profile if exists

**User & Gamification:**
- `getCurrentUser()` - app/actions/users.ts
- `getUserBadges()` - app/actions/users.ts
- `getUserPoints()` - app/actions/users.ts
- Returns user profile, badges, and points/levels

**Other:**
- `getAllEvents()` - app/actions/events.ts
- `getCategories()` - app/actions/categories.ts

---

## Migration Strategy

### What to Keep from /bacheca:
- Server Component pattern
- Welcome section (can be simplified)
- Recent activity concept (for Overview tab)

### What to Migrate from /profile:
- Tab system (but server-rendered with client interactivity)
- Profile editing form
- Badges display with level progress
- Activity list (marketplace items, professional profile)

### New Features to Add:
1. **Tab System** - 5 tabs with URL persistence
2. **Overview Tab** - Statistics cards (mobile-first)
3. **Advanced Filters** - Price range, date picker, multi-category
4. **Search** - Unified search across items/proposals
5. **Quick Actions** - Edit, delete, mark sold with confirmations
6. **Mobile Optimization** - Touch-friendly cards, swipe gestures
7. **Desktop Tables** - Data tables for larger screens

---

## Component Structure

### New Files to Create:
```
app/(private)/bacheca/
  ├─ page.tsx                    (Server - unified bacheca with all data)
  ├─ bacheca-client.tsx          (Client - tab state management)
  ├─ loading.tsx                 (Loading skeleton)
  └─ error.tsx                   (Error boundary)

components/bacheca/
  ├─ overview/
  │   ├─ stats-grid.tsx          (Statistics cards)
  │   └─ recent-activity.tsx     (Recent items/proposals)
  ├─ marketplace/
  │   ├─ marketplace-section.tsx (Tab content)
  │   ├─ item-filters.tsx        (Advanced filters)
  │   └─ item-list.tsx           (List with mobile/desktop views)
  ├─ proposals/
  │   ├─ proposals-section.tsx   (Tab content)
  │   ├─ proposal-filters.tsx    (Status filters)
  │   └─ proposal-list.tsx       (List with mobile/desktop views)
  ├─ professional/
  │   └─ professional-section.tsx (Profile management)
  ├─ profile/
  │   ├─ profile-section.tsx     (User profile from /profile)
  │   ├─ badges-display.tsx      (Badges grid)
  │   └─ profile-edit-form.tsx   (Edit form)
  └─ shared/
      ├─ search-filter-bar.tsx   (Unified search)
      ├─ mobile-item-card.tsx    (Touch-friendly card)
      ├─ desktop-item-table.tsx  (Data table)
      └─ action-menu.tsx         (Quick actions dropdown)
```

---

## Data Flow Design

### Server Component (page.tsx):
```typescript
// Parallel data fetching for optimal performance
const [user, items, proposals, professional, badges, points, events, categories] =
  await Promise.all([
    getCurrentUser(),
    getMyItems(),
    getMyProposals(),
    getMyProfessionalProfile(),
    getUserBadges('current'),
    getUserPoints('current'),
    getAllEvents(),
    getCategories('marketplace_item'),
  ]);

// Calculate statistics
const stats: BachecaStats = {
  marketplace: {
    total: items.length,
    active: items.filter(i => !i.is_sold && i.status === 'approved').length,
    sold: items.filter(i => i.is_sold).length,
    pending: items.filter(i => i.status === 'pending').length,
  },
  professional: {
    exists: !!professional,
    status: professional?.status || null,
    reviewsCount: 0, // TODO: implement reviews
  },
  proposals: {
    total: proposals.length,
    proposed: proposals.filter(p => p.status === 'proposed').length,
    under_review: proposals.filter(p => p.status === 'under_review').length,
    approved: proposals.filter(p => p.status === 'approved').length,
    declined: proposals.filter(p => p.status === 'declined').length,
  },
  points: {
    total: points.totalPoints,
    level: points.level,
  },
};

// Pass to client component
<BachecaClient
  stats={stats}
  marketplaceItems={items}
  proposals={proposals}
  professional={professional}
  userProfile={user}
  badges={badges}
  points={points}
/>
```

### Client Component (bacheca-client.tsx):
```typescript
'use client';

export function BachecaClient({ stats, marketplaceItems, proposals, ... }: Props) {
  const [activeTab, setActiveTab] = useState<BachecaTab>('overview');
  const searchParams = useSearchParams();

  // URL state persistence
  useEffect(() => {
    const tab = searchParams.get('tab') as BachecaTab;
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="marketplace">Marketplace ({stats.marketplace.total})</TabsTrigger>
        <TabsTrigger value="proposte">Proposte ({stats.proposals.total})</TabsTrigger>
        <TabsTrigger value="professionale">Profilo Pro</TabsTrigger>
        <TabsTrigger value="profilo">Profilo & Badges</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <StatsGrid stats={stats} />
        <RecentActivity items={marketplaceItems} proposals={proposals} />
      </TabsContent>

      {/* Other tabs... */}
    </Tabs>
  );
}
```

---

## Mobile-First Approach

### Breakpoints:
- **Mobile:** < 768px - Single column, cards, bottom sheets
- **Tablet:** 768px - 1024px - 2 columns, cards
- **Desktop:** > 1024px - Tables, 3 columns, advanced filters

### Mobile Optimizations:
1. **Touch targets** - Min 44x44px for all interactive elements
2. **Swipe gestures** - Swipe left/right on cards for quick actions
3. **Bottom sheets** - Filters in modal bottom sheet on mobile
4. **Sticky tabs** - Tab bar sticks to top on scroll
5. **Pull to refresh** - Native-like refresh gesture
6. **Infinite scroll** - Lazy load items on mobile

---

## Advanced Filters Design

### Marketplace Filters:
```typescript
interface MarketplaceFilters {
  category?: string;           // Dropdown
  condition?: string;          // Radio group
  status?: string;             // Tabs (All, Active, Sold, Pending)
  is_sold?: boolean;           // Toggle
  price_min?: number;          // Number input
  price_max?: number;          // Number input
  date_from?: string;          // Date picker
  date_to?: string;            // Date picker
  search?: string;             // Text input
}
```

### Proposals Filters:
```typescript
interface ProposalsFilters {
  category?: string;           // Dropdown
  status?: string;             // Tabs (All, Proposed, Under Review, etc.)
  date_from?: string;          // Date picker
  date_to?: string;            // Date picker
  search?: string;             // Text input
}
```

---

## URL State Management

### Tab Persistence:
- `/bacheca` → defaults to Overview tab
- `/bacheca?tab=marketplace` → Marketplace tab
- `/bacheca?tab=proposte` → Proposte tab
- `/bacheca?tab=professionale` → Professional tab
- `/bacheca?tab=profilo` → Profile & Badges tab

### Filter Persistence:
- `/bacheca?tab=marketplace&category=electronics&price_max=100`
- `/bacheca?tab=proposte&status=approved&search=parcheggio`

---

## Quick Actions Design

### Marketplace Items:
- **Edit** - Navigate to `/marketplace/[id]/edit`
- **Delete** - Confirm dialog → soft delete
- **Mark as Sold** - Confirm dialog → update is_sold
- **View** - Navigate to `/marketplace/[id]`

### Proposals:
- **Edit** - Navigate to `/agora/[id]/edit` (only if status='proposed')
- **Delete** - Confirm dialog → hard delete (only if status in ['proposed', 'declined'])
- **View** - Navigate to `/agora/[id]`

### Professional Profile:
- **Edit** - Navigate to `/community-pro/[id]/edit`
- **View** - Navigate to `/community-pro/[id]`

---

## Phase 1 Completion Checklist

- ✅ Analyzed current /bacheca structure
- ✅ Analyzed current /profile structure
- ✅ Identified all required data fetching functions
- ✅ Created `types/bacheca.ts` with all TypeScript interfaces
- ✅ Designed component structure
- ✅ Planned data flow (server + client)
- ✅ Planned mobile-first responsive strategy
- ✅ Designed advanced filters interface
- ✅ Planned URL state management
- ✅ Designed quick actions UX

**Phase 1 Status:** ✅ COMPLETE

**Ready for Phase 2:** Ristrutturazione Bacheca
