-- Migration: Add is_public column to documents table
-- Date: 2025-01-27
-- Author: Claude AI Assistant
-- Description:
--   Adds the 'is_public' column to the documents table to support
--   filtering between public and private documents in the resources section.
--
--   This column was referenced in resources.ts but was missing from the schema.

-- Add is_public column with default false
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false NOT NULL;

-- Create index for faster queries on public documents
CREATE INDEX IF NOT EXISTS idx_documents_is_public
  ON documents(is_public)
  WHERE is_public = true;

-- Add helpful comment
COMMENT ON COLUMN documents.is_public IS 'Whether the document is publicly visible in the resources section';

-- Update existing documents to be public (if they should be)
-- This is a safe default, adjust based on your business logic
-- UPDATE documents SET is_public = true WHERE <your_condition>;
