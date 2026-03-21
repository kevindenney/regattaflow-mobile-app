-- Allow unauthenticated users to read publicly shared steps
CREATE POLICY "Anyone can view publicly shared steps"
  ON timeline_steps
  FOR SELECT
  USING (share_enabled = true AND share_token IS NOT NULL);
