# Supabase Query Syntax Notes

## One-to-Many Joins

Per query con relazioni one-to-many, usare la sintassi:

```typescript
const { data, error } = await supabase
  .from('orchestral_sections')
  .select(`
    id,
    name,
    instruments ( id, name )
  `)
```

## Many-to-Many Joins

Per relazioni many-to-many, Supabase rileva automaticamente la tabella di join:

```typescript
const { data, error } = await supabase
  .from('teams')
  .select(`
    id,
    team_name,
    users ( id, name )
  `)
```

## Multiple Foreign Keys (Ambiguous)

Quando ci sono più foreign keys alla stessa tabella, specificare esplicitamente:

```typescript
const { data, error } = await supabase
  .from('shifts')
  .select(`
    *,
    start_scan:scans!scan_id_start (
      id,
      user_id,
      badge_scan_time
    ),
    end_scan:scans!scan_id_end (
      id,
      user_id,
      badge_scan_time
    )
  `)
```

## Filtering su Relazioni

```typescript
const { data, error } = await supabase
  .from('articles')
  .select(`
    *,
    author:users!author_id (
      id,
      name,
      avatar
    )
  `)
  .eq('tenant_id', tenantId)
  .eq('status', 'published')
  .order('created_at', { ascending: false })
```

## Count su Relazioni

```typescript
const { data, error } = await supabase
  .from('users')
  .select(`
    id,
    name,
    tasks!inner(count)
  `)
```

