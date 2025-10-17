#!/usr/bin/env python3
"""Create Supabase Storage buckets for Prato Rinaldo webapp"""

import subprocess
import json

PROJECT_ID = "kyrliitlqshmwbzaaout"

# Define buckets to create
buckets = [
    {
        "name": "marketplace-images",
        "public": True,
        "allowed_mime_types": ["image/jpeg", "image/png", "image/webp", "image/gif"],
        "file_size_limit": 5242880,  # 5MB in bytes
        "description": "Images for marketplace items"
    },
    {
        "name": "event-images",
        "public": True,
        "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"],
        "file_size_limit": 5242880,  # 5MB
        "description": "Images for events"
    },
    {
        "name": "profile-avatars",
        "public": True,
        "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"],
        "file_size_limit": 2097152,  # 2MB
        "description": "User profile avatars"
    },
    {
        "name": "tenant-logos",
        "public": True,
        "allowed_mime_types": ["image/jpeg", "image/png", "image/svg+xml"],
        "file_size_limit": 1048576,  # 1MB
        "description": "Tenant logos"
    },
    {
        "name": "documents",
        "public": False,
        "allowed_mime_types": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        "file_size_limit": 10485760,  # 10MB
        "description": "Private documents for verified users"
    }
]

def create_bucket_sql(bucket):
    """Generate SQL to create a bucket"""
    # Supabase Storage uses the storage.buckets table
    public_str = "true" if bucket["public"] else "false"
    
    # Create bucket SQL
    sql = f"""
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        '{bucket["name"]}',
        '{bucket["name"]}',
        {public_str},
        {bucket["file_size_limit"]},
        ARRAY{bucket["allowed_mime_types"]}::text[]
    )
    ON CONFLICT (id) DO UPDATE SET
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
    """
    return sql.strip()

def execute_sql(query):
    """Execute SQL via MCP CLI"""
    payload = {
        "project_id": PROJECT_ID,
        "query": query
    }
    
    cmd = [
        "manus-mcp-cli", "tool", "call", "execute_sql",
        "--server", "supabase",
        "--input", json.dumps(payload)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return True, None
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def main():
    print(f"Creating {len(buckets)} Storage buckets...")
    print("=" * 60)
    
    success_count = 0
    failed_buckets = []
    
    for i, bucket in enumerate(buckets, 1):
        print(f"[{i}/{len(buckets)}] Creating bucket: {bucket['name']}...", end=" ")
        
        sql = create_bucket_sql(bucket)
        success, error = execute_sql(sql)
        
        if success:
            print("✓")
            success_count += 1
        else:
            print("✗")
            failed_buckets.append((bucket['name'], error))
    
    print("=" * 60)
    print(f"\nResults: {success_count}/{len(buckets)} buckets created successfully")
    
    if failed_buckets:
        print(f"\n⚠️  {len(failed_buckets)} buckets failed:")
        for name, error in failed_buckets:
            print(f"  - {name}")
            if error:
                print(f"    Error: {error[:200]}")
    else:
        print("\n✅ All buckets created successfully!")
    
    # Now create RLS policies for buckets
    print("\n" + "=" * 60)
    print("Creating RLS policies for Storage buckets...")
    print("=" * 60)
    
    create_storage_policies()

def create_storage_policies():
    """Create RLS policies for storage buckets"""
    policies = [
        # Public buckets - anyone can read
        """
        CREATE POLICY "Public buckets are viewable by everyone"
        ON storage.objects FOR SELECT
        USING (bucket_id IN ('marketplace-images', 'event-images', 'profile-avatars', 'tenant-logos'));
        """,
        
        # Marketplace images - verified users can upload
        """
        CREATE POLICY "Verified users can upload marketplace images"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'marketplace-images'
            AND public.is_verified()
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
        """,
        
        # Event images - verified users can upload
        """
        CREATE POLICY "Verified users can upload event images"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'event-images'
            AND public.is_verified()
        );
        """,
        
        # Profile avatars - users can upload their own
        """
        CREATE POLICY "Users can upload own avatar"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'profile-avatars'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
        """,
        
        # Tenant logos - only admins
        """
        CREATE POLICY "Admins can upload tenant logos"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'tenant-logos'
            AND public.is_admin()
        );
        """,
        
        # Documents - private, only verified users can read their tenant's docs
        """
        CREATE POLICY "Verified users can view documents"
        ON storage.objects FOR SELECT
        USING (
            bucket_id = 'documents'
            AND public.is_verified()
        );
        """,
        
        # Documents - admins can upload
        """
        CREATE POLICY "Admins can upload documents"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'documents'
            AND public.is_admin()
        );
        """,
        
        # Users can update their own uploads
        """
        CREATE POLICY "Users can update own uploads"
        ON storage.objects FOR UPDATE
        USING (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        );
        """,
        
        # Users can delete their own uploads
        """
        CREATE POLICY "Users can delete own uploads"
        ON storage.objects FOR DELETE
        USING (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        );
        """
    ]
    
    success_count = 0
    for i, policy in enumerate(policies, 1):
        policy_name = policy.split('"')[1] if '"' in policy else f"Policy {i}"
        print(f"[{i}/{len(policies)}] Creating: {policy_name}...", end=" ")
        
        success, error = execute_sql(policy.strip())
        
        if success:
            print("✓")
            success_count += 1
        else:
            print("✗")
            if error and "already exists" not in error:
                print(f"    Error: {error[:200]}")
    
    print("=" * 60)
    print(f"\nStorage policies: {success_count}/{len(policies)} created successfully")

if __name__ == "__main__":
    main()

