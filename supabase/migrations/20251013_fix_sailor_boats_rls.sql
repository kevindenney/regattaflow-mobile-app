-- Fix sailor_boats RLS policies to allow inserts
-- The original policy only had USING clause, which doesn't work for INSERT operations
-- We need WITH CHECK clause for INSERT/UPDATE operations

-- Drop the existing policy
DROP POLICY IF EXISTS "Sailors can manage their own boats" ON sailor_boats;

-- Create separate policies for better clarity and performance

-- Allow sailors to view their own boats
DROP POLICY IF EXISTS "Sailors can view their own boats" ON sailor_boats;
CREATE POLICY "Sailors can view their own boats"
  ON sailor_boats FOR SELECT
  USING (auth.uid() = sailor_id);

-- Allow sailors to insert their own boats
CREATE POLICY "Sailors can insert their own boats"
  ON sailor_boats FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

-- Allow sailors to update their own boats
CREATE POLICY "Sailors can update their own boats"
  ON sailor_boats FOR UPDATE
  USING (auth.uid() = sailor_id)
  WITH CHECK (auth.uid() = sailor_id);

-- Allow sailors to delete their own boats
CREATE POLICY "Sailors can delete their own boats"
  ON sailor_boats FOR DELETE
  USING (auth.uid() = sailor_id);
