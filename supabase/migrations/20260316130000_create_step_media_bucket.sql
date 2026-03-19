-- Create storage bucket for step session media (photos/videos)
-- Uses small file limits to keep storage costs low.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'step-media',
  'step-media',
  true,
  5242880, -- 5 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload step media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'step-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: anyone can view step media (public bucket)
CREATE POLICY "Step media is publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'step-media');

-- RLS: users can delete their own media
CREATE POLICY "Users can delete own step media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'step-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
