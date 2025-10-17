-- Add onboarding and roles fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS membershipType ENUM('resident', 'domiciled', 'landowner') AFTER verificationStatus;
ALTER TABLE users ADD COLUMN IF NOT EXISTS street VARCHAR(255) AFTER membershipType;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streetNumber VARCHAR(20) AFTER street;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zipCode VARCHAR(10) DEFAULT '00030' AFTER streetNumber;
ALTER TABLE users ADD COLUMN IF NOT EXISTS municipality ENUM('san_cesareo', 'zagarolo') AFTER zipCode;
ALTER TABLE users ADD COLUMN IF NOT EXISTS householdSize INT AFTER municipality;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hasMinors BOOLEAN DEFAULT false AFTER householdSize;
ALTER TABLE users ADD COLUMN IF NOT EXISTS minorsCount INT AFTER hasMinors;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hasSeniors BOOLEAN DEFAULT false AFTER minorsCount;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seniorsCount INT AFTER hasSeniors;
ALTER TABLE users ADD COLUMN IF NOT EXISTS adminRole ENUM('super_admin', 'admin', 'moderator') AFTER seniorsCount;
ALTER TABLE users ADD COLUMN IF NOT EXISTS adminPermissions JSON AFTER adminRole;
ALTER TABLE users ADD COLUMN IF NOT EXISTS committeeRole ENUM('president', 'vice_president', 'secretary', 'treasurer', 'board_member', 'council_member') AFTER adminPermissions;
ALTER TABLE users ADD COLUMN IF NOT EXISTS isInBoard BOOLEAN DEFAULT false AFTER committeeRole;
ALTER TABLE users ADD COLUMN IF NOT EXISTS isInCouncil BOOLEAN DEFAULT false AFTER isInBoard;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboardingCompleted BOOLEAN DEFAULT false AFTER isInCouncil;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboardingStep INT DEFAULT 0 AFTER onboardingCompleted;

-- Drop old address column if exists
ALTER TABLE users DROP COLUMN IF EXISTS address;

-- Add tenant configuration fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS secondaryColor VARCHAR(20) DEFAULT '#f97316' AFTER primaryColor;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS heroImage VARCHAR(500) AFTER secondaryColor;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contactEmail VARCHAR(320) AFTER heroImage;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contactPhone VARCHAR(50) AFTER contactEmail;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT AFTER contactPhone;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS socialFacebook VARCHAR(500) AFTER address;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS socialInstagram VARCHAR(500) AFTER socialFacebook;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS socialTwitter VARCHAR(500) AFTER socialInstagram;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT true NOT NULL AFTER socialTwitter;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS maintenanceMode BOOLEAN DEFAULT false NOT NULL AFTER isActive;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS maintenanceMessage TEXT AFTER maintenanceMode;

