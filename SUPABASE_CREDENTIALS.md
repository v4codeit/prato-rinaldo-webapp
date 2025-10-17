# Supabase Credentials - Prato Rinaldo WebApp

## Project Information
- **Project ID**: kyrliitlqshmwbzaaout
- **Region**: EU Central 2 (Frankfurt)
- **Project URL**: https://kyrliitlqshmwbzaaout.supabase.co

## API Keys

### Public Anon Key (client-side)
```
NEXT_PUBLIC_SUPABASE_URL=https://kyrliitlqshmwbzaaout.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cmxpaXRscXNobXdiemFhb3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjI2MDcsImV4cCI6MjA3NjE5ODYwN30.XJYx5i7yFv-x1GsUqN-F1vuMF8eO3Y2VTkIsR06CygM
```

### Service Role Key (server-side)
⚠️ **IMPORTANTE**: La Service Role Key deve essere recuperata manualmente dalla dashboard Supabase:
1. Vai su https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout/settings/api
2. Copia la **service_role** key (secret)
3. Aggiungi al file .env come `SUPABASE_SERVICE_ROLE_KEY`

## Database Configuration

### Connection String
```
postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-2.pooler.supabase.com:6543/postgres
```

### Direct Connection (for migrations)
Recupera dalla dashboard: Settings > Database > Connection string

## Storage Buckets Created

| Bucket Name | Public | Max Size | Allowed Types |
|-------------|--------|----------|---------------|
| marketplace-images | ✅ Yes | 5MB | image/* |
| event-images | ✅ Yes | 5MB | image/* |
| profile-avatars | ✅ Yes | 2MB | image/* |
| tenant-logos | ✅ Yes | 1MB | image/*, svg |
| documents | ❌ No | 10MB | pdf, doc, docx |

## RLS Policies Summary

### Database Tables
- **17 tables** with RLS enabled
- **50 RLS policies** implemented
- **3 helper functions** created (get_user_tenant_id, is_admin, is_verified)

### Storage Buckets
- **9 storage policies** implemented
- Public buckets: read access for everyone
- Upload restrictions: based on user verification and ownership

## Authentication Providers

### To Configure:
1. **Google OAuth** (recommended for users)
   - Dashboard > Authentication > Providers > Google
   - Configure OAuth client in Google Cloud Console
   
2. **Email/Password** (fallback)
   - Already enabled by default in Supabase

## Next Steps for Configuration

1. [ ] Recuperare Service Role Key dalla dashboard
2. [ ] Configurare Google OAuth provider
3. [ ] Configurare Email templates (welcome, reset password, etc.)
4. [ ] Testare autenticazione con utente test
5. [ ] Configurare Redirect URLs per produzione

## Useful Links

- **Dashboard**: https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout
- **API Docs**: https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout/api
- **Database**: https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout/editor
- **Storage**: https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout/storage/buckets
- **Auth**: https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout/auth/users

---

**Generated**: 2025-10-17
**Migration Status**: Phase 3 of 8 completed

