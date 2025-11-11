# Moderation Queue Analysis

## 1. Schema Summary

Table: moderation_queue
Location: supabase/migrations/00000_initial_schema.sql (lines 451-480)

### Columns (19 total):
- id (UUID PK)
- tenant_id (UUID FK)
- item_type (ENUM)
- item_id (UUID)
- item_title (VARCHAR 500)
- item_content (TEXT)
- item_creator_id (UUID FK, added in 00020)
- item_creator_name (VARCHAR 255)
- status (ENUM: pending/in_review/approved/rejected)
- priority (ENUM: low/medium/high/urgent)
- assigned_to (UUID FK)
- moderated_by (UUID FK)
- moderated_at (TIMESTAMPTZ)
- moderation_note (TEXT) <-- FIELD EXISTS!
- report_count (INT)
- report_reasons (JSONB)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

## 2. Key Finding: moderation_note Field

STATUS: EXISTS (confirmed)
Type: TEXT
Nullable: YES
Line: 472 in 00000_initial_schema.sql
Purpose: Store moderator notes/reasoning

## 3. moderated_by Field

STATUS: EXISTS (confirmed)
Type: UUID (Foreign Key to users.id)
Nullable: YES  
Line: 470 in 00000_initial_schema.sql
Purpose: References moderator who took action

## 4. All Indexes (6 total)

1. idx_moderation_queue_tenant (tenant_id)
2. idx_moderation_queue_status (status)
3. idx_moderation_queue_type (item_type)
4. idx_moderation_queue_assigned (assigned_to)
5. idx_moderation_queue_creator (item_creator_id)
6. idx_moderation_queue_item_creator_fk (item_creator_id partial, added in 00020)

## 5. Foreign Keys (4 total)

- tenant_id -> tenants.id (CASCADE)
- assigned_to -> users.id
- moderated_by -> users.id
- item_creator_id -> users.id (SET NULL, added in 00020)

## 6. Join with service_profiles

Best Pattern:
LEFT JOIN moderation_queue mq ON 
  mq.item_id = sp.id 
  AND mq.item_type = 'service_profile'

## 7. Query Rejected Profiles with Notes

SELECT 
  mq.id,
  mq.item_id,
  mq.item_creator_name,
  mq.moderation_note,
  mq.moderated_by,
  u.name as moderator_name,
  mq.moderated_at
FROM moderation_queue mq
LEFT JOIN users u ON mq.moderated_by = u.id
WHERE 
  mq.tenant_id = 'TENANT_ID'
  AND mq.item_type = 'service_profile'
  AND mq.status = 'rejected'
ORDER BY mq.moderated_at DESC NULLS LAST;

## 8. SQL Join Patterns

Pattern A: LEFT JOIN users u_moderator ON mq.moderated_by = u_moderator.id
Pattern B: LEFT JOIN users u_creator ON mq.item_creator_id = u_creator.id  
Pattern C: LEFT JOIN users u_assigned ON mq.assigned_to = u_assigned.id
Pattern D: INNER JOIN service_profiles sp ON mq.item_id = sp.id AND mq.item_type = 'service_profile'
Pattern E: LEFT JOIN moderation_actions_log mal ON mal.queue_item_id = mq.id

## 9. Enum Types

moderation_item_type: marketplace, service_profile, proposal, proposal_comment, tutorial_request
moderation_status: pending, in_review, approved, rejected
moderation_priority: low, medium, high, urgent

## 10. Key Takeaways

✓ moderation_note: EXISTS - TEXT field, NULL by default
✓ moderated_by: EXISTS - UUID FK to users
✓ 6 indexes for performance optimization
✓ 4 foreign key relationships
✓ item_creator_id FK added in migration 00020
✓ PostgREST relationships enabled after 00020
✓ RLS policies control access by role
✓ Denormalization for context retention
✓ Audit trail in moderation_actions_log
