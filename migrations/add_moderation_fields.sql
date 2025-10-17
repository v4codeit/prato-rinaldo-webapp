-- Add moderation fields to professional_profiles
ALTER TABLE professional_profiles 
ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' NOT NULL AFTER website,
ADD COLUMN moderatedBy VARCHAR(64) AFTER status,
ADD COLUMN moderatedAt TIMESTAMP NULL AFTER moderatedBy,
ADD COLUMN moderationNote TEXT AFTER moderatedAt,
ADD COLUMN reportCount INT DEFAULT 0 AFTER moderationNote,
ADD COLUMN isReported BOOLEAN DEFAULT false AFTER reportCount,
ADD COLUMN reportedBy JSON AFTER isReported;

-- Add moderation fields to forum_threads
ALTER TABLE forum_threads
ADD COLUMN reportCount INT DEFAULT 0 AFTER viewCount,
ADD COLUMN isReported BOOLEAN DEFAULT false AFTER reportCount,
ADD COLUMN reportedBy JSON AFTER isReported,
ADD COLUMN moderatedBy VARCHAR(64) AFTER reportedBy,
ADD COLUMN moderatedAt TIMESTAMP NULL AFTER moderatedBy;

-- Add moderation fields to forum_posts
ALTER TABLE forum_posts
ADD COLUMN reportCount INT DEFAULT 0 AFTER content,
ADD COLUMN isReported BOOLEAN DEFAULT false AFTER reportCount,
ADD COLUMN reportedBy JSON AFTER isReported,
ADD COLUMN moderatedBy VARCHAR(64) AFTER reportedBy,
ADD COLUMN moderatedAt TIMESTAMP NULL AFTER moderatedBy;

-- Create moderation_queue table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id VARCHAR(64) PRIMARY KEY,
  tenantId VARCHAR(64) NOT NULL,
  
  itemType ENUM('marketplace', 'professional_profile', 'forum_thread', 'forum_post', 'tutorial_request') NOT NULL,
  itemId VARCHAR(64) NOT NULL,
  
  itemTitle VARCHAR(500),
  itemContent TEXT,
  itemCreatorId VARCHAR(64),
  itemCreatorName VARCHAR(255),
  
  status ENUM('pending', 'in_review', 'approved', 'rejected') DEFAULT 'pending' NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' NOT NULL,
  
  assignedTo VARCHAR(64),
  moderatedBy VARCHAR(64),
  moderatedAt TIMESTAMP NULL,
  moderationNote TEXT,
  
  reportCount INT DEFAULT 0,
  reportReasons JSON,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX tenant_idx (tenantId),
  INDEX status_idx (status),
  INDEX type_idx (itemType),
  INDEX assigned_idx (assignedTo),
  INDEX creator_idx (itemCreatorId)
);

-- Create moderation_actions_log table
CREATE TABLE IF NOT EXISTS moderation_actions_log (
  id VARCHAR(64) PRIMARY KEY,
  tenantId VARCHAR(64) NOT NULL,
  
  queueItemId VARCHAR(64) NOT NULL,
  itemType VARCHAR(50) NOT NULL,
  itemId VARCHAR(64) NOT NULL,
  
  action ENUM('created', 'assigned', 'approved', 'rejected', 'reported', 'edited', 'deleted') NOT NULL,
  performedBy VARCHAR(64) NOT NULL,
  performedByName VARCHAR(255),
  
  previousStatus VARCHAR(50),
  newStatus VARCHAR(50),
  note TEXT,
  metadata JSON,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX tenant_idx (tenantId),
  INDEX queue_idx (queueItemId),
  INDEX performer_idx (performedBy),
  INDEX action_idx (action)
);

