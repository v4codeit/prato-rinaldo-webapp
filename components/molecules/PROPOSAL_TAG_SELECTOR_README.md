# ProposalTagSelector Component

A mobile-first, accessible React component for selecting multiple tags in proposal forms.

## File Locations

- **Component:** `D:\develop\pratorinaldo-next\components\molecules\proposal-tag-selector.tsx`
- **Example:** `D:\develop\pratorinaldo-next\components\molecules\proposal-tag-selector-example.tsx`
- **Types:** `D:\develop\pratorinaldo-next\types\proposals.ts`

## Features

- ✅ **Multi-selection** with configurable max limit
- ✅ **Search/filter** tags by name
- ✅ **Visual feedback** for selected state and limit reached
- ✅ **Colored badges** matching tag colors with transparency
- ✅ **Emoji/icon support** for visual identification
- ✅ **Keyboard accessible** using shadcn Command component
- ✅ **Mobile-first responsive** design
- ✅ **Disabled state** for read-only views

## Props Interface

```typescript
interface ProposalTagSelectorProps {
  /** Array of available tags for selection */
  availableTags: ProposalTag[];

  /** Array of currently selected tag IDs */
  selectedTagIds: string[];

  /** Callback when selection changes */
  onChange: (tagIds: string[]) => void;

  /** Disable entire component */
  disabled?: boolean;

  /** Max number of selectable tags (default: 5) */
  maxTags?: number;

  /** Placeholder text for input */
  placeholder?: string;
}
```

## ProposalTag Type

```typescript
interface ProposalTag {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;           // Hex color (e.g., "#3b82f6")
  icon: string | null;     // Emoji or icon
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

## Basic Usage

```tsx
'use client';

import { useState } from 'react';
import { ProposalTagSelector } from '@/components/molecules/proposal-tag-selector';
import type { ProposalTag } from '@/types/proposals';

export function CreateProposalForm() {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Fetch tags from your data source
  const availableTags: ProposalTag[] = [ /* ... */ ];

  return (
    <form>
      <ProposalTagSelector
        availableTags={availableTags}
        selectedTagIds={selectedTagIds}
        onChange={setSelectedTagIds}
      />
    </form>
  );
}
```

## Usage Examples

### 1. With Form Data

```tsx
function ProposalForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tagIds: [] as string[],
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Other fields... */}

      <ProposalTagSelector
        availableTags={allTags}
        selectedTagIds={formData.tagIds}
        onChange={(tagIds) => setFormData({ ...formData, tagIds })}
      />
    </form>
  );
}
```

### 2. With Validation

```tsx
function ValidatedSelector() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleChange = (tagIds: string[]) => {
    setSelectedTags(tagIds);
    if (tagIds.length > 0) {
      setError('');
    }
  };

  const validate = () => {
    if (selectedTags.length === 0) {
      setError('Seleziona almeno un tag');
      return false;
    }
    return true;
  };

  return (
    <>
      <ProposalTagSelector
        availableTags={allTags}
        selectedTagIds={selectedTags}
        onChange={handleChange}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </>
  );
}
```

### 3. Custom Max Limit

```tsx
<ProposalTagSelector
  availableTags={allTags}
  selectedTagIds={selectedTags}
  onChange={setSelectedTags}
  maxTags={3}  // Allow only 3 tags
/>
```

### 4. Pre-selected Tags (Edit Mode)

```tsx
function EditProposal({ proposal }) {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    proposal.tags.map(t => t.id)  // Pre-populate with existing tags
  );

  return (
    <ProposalTagSelector
      availableTags={allTags}
      selectedTagIds={selectedTags}
      onChange={setSelectedTags}
    />
  );
}
```

### 5. Disabled/Read-only

```tsx
<ProposalTagSelector
  availableTags={allTags}
  selectedTagIds={proposal.tagIds}
  onChange={() => {}}
  disabled  // Read-only view
/>
```

## UI Design

### Selected Tags Display

Selected tags appear as colored badges:

```
┌─────────────────────────────────────────────┐
│ [🌐 Online ×] [⚡ Urgente ×]  [+ Aggiungi]  │
└─────────────────────────────────────────────┘
```

- Background color: Tag color at 20% opacity
- Border color: Tag color
- Text color: Tag color
- Remove button (X) on each badge

### Dropdown Menu

Click "Aggiungi" to open searchable dropdown:

```
┌─────────────────────────────────────────────┐
│ 🔍 Cerca tag...                             │
├─────────────────────────────────────────────┤
│ ☑ 🌐 Online                            ●    │
│ ☐ 🏘️ Offline                          ●    │
│ ☑ ⚡ Urgente                           ●    │
│ ☐ 💡 Idea                             ●    │
│ ☐ 🐛 Problema                          ●    │
├─────────────────────────────────────────────┤
│ Limite massimo raggiunto (5 tag)           │
└─────────────────────────────────────────────┘
```

Each item shows:
- Checkbox (visual only, not input)
- Tag icon/emoji
- Tag name
- Color indicator dot

## Styling

### Project Design Tokens

- **Border radius:** `rounded-xl` (Tailwind class)
- **Primary color:** `violet-600` (#8b5cf6)
- **Text colors:** `slate-*` scale
- **Focus ring:** `ring-violet-600/20`

### Custom Badge Colors

Tag badges use the tag's hex color with 20% opacity for background:

```typescript
const getBadgeStyle = (color: string) => {
  return {
    backgroundColor: `${color}20`, // 20% opacity
    borderColor: color,
    color: color,
  };
};
```

### Responsive Breakpoints

- **Mobile:** < 768px - Full width, compact spacing
- **Desktop:** ≥ 768px - Larger popover width (320px vs 280px)

## Accessibility

### ARIA Labels

- Each remove button has `aria-label="Rimuovi tag {name}"`
- Color indicators are `aria-hidden="true"`

### Keyboard Navigation

- **Tab:** Navigate between badges and "Aggiungi" button
- **Enter/Space:** Open dropdown, select/deselect tags
- **Escape:** Close dropdown
- **Arrow keys:** Navigate dropdown items
- **Type to search:** Filter tags in real-time

### Focus Management

- Focus ring on buttons: `focus:ring-2 focus:ring-offset-0`
- Disabled items have `disabled:opacity-50`
- Command items use `data-[selected=true]:bg-accent`

## Dependencies

### shadcn/ui Components

- `Badge` - For selected tag display
- `Button` - "Aggiungi" trigger button
- `Popover` - Dropdown container
- `Command` - Searchable command menu (cmdk)
  - `CommandInput` - Search input
  - `CommandList` - Scrollable list
  - `CommandEmpty` - Empty state
  - `CommandGroup` - Items wrapper
  - `CommandItem` - Individual selectable item

### Icons (lucide-react)

- `Plus` - "Aggiungi" button icon
- `X` - Remove badge icon
- `Check` - Selected checkbox indicator

## State Management

### Internal State

- `open: boolean` - Controls popover visibility

### Computed Values

```typescript
// Active tags only (is_active = true)
const activeTags = useMemo(
  () => availableTags.filter((tag) => tag.is_active),
  [availableTags]
);

// Selected tags with full data
const selectedTags = useMemo(
  () => activeTags.filter((tag) => selectedTagIds.includes(tag.id)),
  [activeTags, selectedTagIds]
);

// Max limit check
const isMaxReached = selectedTagIds.length >= maxTags;
```

## Behavior

### Selection Logic

1. **Add tag:** Click unchecked tag in dropdown
   - Only if `selectedTagIds.length < maxTags`
   - Adds tag ID to `selectedTagIds` array

2. **Remove tag:** Click X on badge OR click checked tag in dropdown
   - Removes tag ID from `selectedTagIds` array

3. **Max limit reached:**
   - "Aggiungi" button is disabled
   - Unselected tags in dropdown are disabled
   - Footer message displays: "Limite massimo raggiunto (N tag)"

### Search/Filter

- Search is case-insensitive
- Filters by tag `name` field
- Powered by cmdk's built-in search

## Integration with Forms

### Uncontrolled Form (FormData)

```tsx
<form action={createProposal}>
  <input type="hidden" name="tagIds" value={selectedTagIds.join(',')} />
  <ProposalTagSelector
    availableTags={allTags}
    selectedTagIds={selectedTagIds}
    onChange={setSelectedTagIds}
  />
</form>
```

### Server Action

```tsx
// app/actions/proposals.ts
export async function createProposal(formData: FormData) {
  const tagIds = formData.get('tagIds')?.toString().split(',') || [];

  // Insert proposal...
  // Insert tag assignments...
}
```

### With Zod Validation

```typescript
import { z } from 'zod';

const proposalSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50),
  tagIds: z.array(z.string().uuid()).min(1).max(5),
});

const parsed = proposalSchema.safeParse({
  title: formData.title,
  description: formData.description,
  tagIds: selectedTagIds,
});
```

## Performance Optimizations

### useMemo for Filtering

Active and selected tags are memoized to prevent unnecessary recalculations:

```typescript
const activeTags = React.useMemo(
  () => availableTags.filter((tag) => tag.is_active),
  [availableTags]
);
```

### Command Component Virtualization

The Command component (cmdk) automatically virtualizes long lists for performance.

## Testing Considerations

### Unit Tests

Test scenarios:
- Tag selection/deselection
- Max limit enforcement
- Disabled state
- Search filtering
- Pre-selected tags

### Accessibility Tests

- Keyboard navigation
- Screen reader compatibility
- Focus management

### Visual Regression

- Badge color rendering
- Mobile/desktop layouts
- Overflow handling

## Common Pitfalls

### ❌ Wrong: Mutating State

```tsx
// DON'T mutate selectedTagIds directly
const handleAdd = (id: string) => {
  selectedTagIds.push(id);  // ❌ Mutation!
  onChange(selectedTagIds);
};
```

### ✅ Correct: Immutable Updates

```tsx
const handleAdd = (id: string) => {
  onChange([...selectedTagIds, id]);  // ✅ New array
};
```

### ❌ Wrong: Forgetting type="button"

```tsx
<button onClick={handleRemove}>  {/* ❌ Submits form! */}
  <X />
</button>
```

### ✅ Correct: Explicit type

```tsx
<button type="button" onClick={handleRemove}>  {/* ✅ Safe */}
  <X />
</button>
```

## Customization

### Custom Colors

To use custom color schemes, modify `getBadgeStyle`:

```typescript
const getBadgeStyle = (color: string, theme: 'light' | 'dark') => {
  const opacity = theme === 'dark' ? '30' : '20';
  return {
    backgroundColor: `${color}${opacity}`,
    borderColor: color,
    color: theme === 'dark' ? '#fff' : color,
  };
};
```

### Custom Icons

Replace emoji icons with custom SVG:

```tsx
{tag.icon && (
  typeof tag.icon === 'string' && tag.icon.startsWith('<svg')
    ? <div dangerouslySetInnerHTML={{ __html: tag.icon }} />
    : <span className="text-lg">{tag.icon}</span>
)}
```

## Future Enhancements

Potential improvements:
- Tag groups/categories
- Recently used tags section
- Drag-and-drop reordering of selected tags
- Tag creation from selector
- Color picker for admin tag management
- Tag popularity indicators

## Related Files

- `types/proposals.ts` - ProposalTag interface
- `app/actions/proposal-tags.ts` - Server actions for tag CRUD
- `app/actions/proposals.ts` - Server actions for proposal creation
- Database migration: `proposal_tags` table
- Database migration: `proposal_tag_assignments` junction table

## License

Part of the Prato Rinaldo Community Platform project.
