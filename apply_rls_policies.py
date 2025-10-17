#!/usr/bin/env python3
"""Apply RLS policies to Supabase database"""

import subprocess
import json

PROJECT_ID = "kyrliitlqshmwbzaaout"

# Define all policies as separate statements
policies = [
    # Tenants policies
    '''CREATE POLICY "Tenants are viewable by everyone" ON tenants FOR SELECT USING (is_active = true);''',
    '''CREATE POLICY "Only super_admin can modify tenants" ON tenants FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));''',
    
    # Users policies
    '''CREATE POLICY "Users can view verified users in same tenant" ON users FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND verification_status = 'approved');''',
    '''CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());''',
    '''CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    '''CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    
    # Articles policies
    '''CREATE POLICY "Published articles are viewable" ON articles FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND status = 'published');''',
    '''CREATE POLICY "Admins can view all articles" ON articles FOR SELECT USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    '''CREATE POLICY "Admins can manage articles" ON articles FOR ALL USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    
    # Events policies
    '''CREATE POLICY "Public events are viewable" ON events FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND event_type = 'public');''',
    '''CREATE POLICY "Private events for verified users" ON events FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND (event_type = 'public' OR public.is_verified()));''',
    '''CREATE POLICY "Verified users can create events" ON events FOR INSERT WITH CHECK (public.is_verified() AND tenant_id = public.get_user_tenant_id() AND organizer_id = auth.uid());''',
    '''CREATE POLICY "Organizers and admins can manage events" ON events FOR ALL USING (tenant_id = public.get_user_tenant_id() AND (organizer_id = auth.uid() OR public.is_admin()));''',
    
    # Event RSVPs policies
    '''CREATE POLICY "Users can view event RSVPs" ON event_rsvps FOR SELECT USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_rsvps.event_id AND events.tenant_id = public.get_user_tenant_id()));''',
    '''CREATE POLICY "Users can manage own RSVPs" ON event_rsvps FOR ALL USING (user_id = auth.uid() AND public.is_verified()) WITH CHECK (user_id = auth.uid() AND public.is_verified());''',
    
    # Marketplace policies
    '''CREATE POLICY "Approved marketplace items are viewable" ON marketplace_items FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND status = 'approved');''',
    '''CREATE POLICY "Sellers can view own items" ON marketplace_items FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND seller_id = auth.uid());''',
    '''CREATE POLICY "Admins can view all marketplace items" ON marketplace_items FOR SELECT USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    '''CREATE POLICY "Verified users can create marketplace items" ON marketplace_items FOR INSERT WITH CHECK (public.is_verified() AND tenant_id = public.get_user_tenant_id() AND seller_id = auth.uid());''',
    '''CREATE POLICY "Sellers can update own items" ON marketplace_items FOR UPDATE USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());''',
    '''CREATE POLICY "Admins can update marketplace items" ON marketplace_items FOR UPDATE USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    
    # Professional profiles policies
    '''CREATE POLICY "Approved profiles are viewable" ON professional_profiles FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND status = 'approved' AND public.is_verified());''',
    '''CREATE POLICY "Users can view own profiles" ON professional_profiles FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());''',
    '''CREATE POLICY "Verified users can create profiles" ON professional_profiles FOR INSERT WITH CHECK (public.is_verified() AND tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());''',
    '''CREATE POLICY "Users can update own profiles" ON professional_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());''',
    '''CREATE POLICY "Admins can manage profiles" ON professional_profiles FOR ALL USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    
    # Forum categories policies
    '''CREATE POLICY "Forum categories viewable by verified users" ON forum_categories FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND public.is_verified());''',
    
    # Forum threads policies
    '''CREATE POLICY "Approved threads viewable" ON forum_threads FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND status = 'approved' AND public.is_verified());''',
    '''CREATE POLICY "Verified users can create threads" ON forum_threads FOR INSERT WITH CHECK (public.is_verified() AND tenant_id = public.get_user_tenant_id() AND author_id = auth.uid());''',
    '''CREATE POLICY "Authors can update own threads" ON forum_threads FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());''',
    '''CREATE POLICY "Admins can manage threads" ON forum_threads FOR ALL USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    
    # Forum posts policies
    '''CREATE POLICY "Approved posts viewable" ON forum_posts FOR SELECT USING (status = 'approved' AND public.is_verified());''',
    '''CREATE POLICY "Verified users can create posts" ON forum_posts FOR INSERT WITH CHECK (public.is_verified() AND author_id = auth.uid());''',
    '''CREATE POLICY "Authors can update own posts" ON forum_posts FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());''',
    '''CREATE POLICY "Admins can manage posts" ON forum_posts FOR ALL USING (public.is_admin());''',
    
    # Tutorial requests policies
    '''CREATE POLICY "Verified users can view tutorials" ON tutorial_requests FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND public.is_verified());''',
    '''CREATE POLICY "Verified users can create tutorial requests" ON tutorial_requests FOR INSERT WITH CHECK (public.is_verified() AND tenant_id = public.get_user_tenant_id() AND requester_id = auth.uid());''',
    '''CREATE POLICY "Admins can manage tutorial requests" ON tutorial_requests FOR ALL USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    
    # Documents policies
    '''CREATE POLICY "Verified users can view documents" ON documents FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND public.is_verified());''',
    '''CREATE POLICY "Admins can manage documents" ON documents FOR ALL USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    
    # Gamification policies
    '''CREATE POLICY "Badges viewable by verified users" ON badges FOR SELECT USING (tenant_id = public.get_user_tenant_id() AND public.is_verified());''',
    '''CREATE POLICY "User badges viewable" ON user_badges FOR SELECT USING (public.is_verified());''',
    '''CREATE POLICY "Users can view own points" ON user_points FOR SELECT USING (user_id = auth.uid());''',
    '''CREATE POLICY "Admins can manage badges" ON badges FOR ALL USING (public.is_admin());''',
    '''CREATE POLICY "Admins can manage user badges" ON user_badges FOR ALL USING (public.is_admin());''',
    '''CREATE POLICY "Admins can manage user points" ON user_points FOR ALL USING (public.is_admin());''',
    
    # Moderation policies
    '''CREATE POLICY "Admins can view moderation queue" ON moderation_queue FOR SELECT USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    '''CREATE POLICY "Admins can manage moderation queue" ON moderation_queue FOR ALL USING (public.is_admin() AND tenant_id = public.get_user_tenant_id());''',
    '''CREATE POLICY "Admins can view moderation actions" ON moderation_actions_log FOR SELECT USING (public.is_admin());''',
    '''CREATE POLICY "Admins can create moderation actions" ON moderation_actions_log FOR INSERT WITH CHECK (public.is_admin() AND moderator_id = auth.uid());''',
]

def execute_policy(query):
    """Execute a single policy via MCP CLI"""
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
    print(f"Applying {len(policies)} RLS policies...")
    print("=" * 60)
    
    success_count = 0
    failed_policies = []
    
    for i, policy in enumerate(policies, 1):
        # Extract policy name from query
        policy_name = policy.split('"')[1] if '"' in policy else f"Policy {i}"
        
        print(f"[{i}/{len(policies)}] Applying: {policy_name}...", end=" ")
        
        success, error = execute_policy(policy)
        
        if success:
            print("✓")
            success_count += 1
        else:
            print("✗")
            failed_policies.append((policy_name, error))
    
    print("=" * 60)
    print(f"\nResults: {success_count}/{len(policies)} policies applied successfully")
    
    if failed_policies:
        print(f"\n⚠️  {len(failed_policies)} policies failed:")
        for name, error in failed_policies:
            print(f"  - {name}")
            if error:
                print(f"    Error: {error[:200]}")
    else:
        print("\n✅ All policies applied successfully!")

if __name__ == "__main__":
    main()

