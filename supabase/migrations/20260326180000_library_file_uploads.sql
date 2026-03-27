-- Add file upload resource types to library_resources
-- New types: pdf, image, document, note

-- 1. Drop and recreate the CHECK constraint with new types
ALTER TABLE library_resources
  DROP CONSTRAINT IF EXISTS library_resources_resource_type_check;

ALTER TABLE library_resources
  ADD CONSTRAINT library_resources_resource_type_check
  CHECK (resource_type IN (
    'online_course', 'youtube_channel', 'youtube_video',
    'website', 'book_digital', 'book_physical',
    'social_media', 'cloud_folder',
    'pdf', 'image', 'document', 'note',
    'other'
  ));

-- 2. Create storage bucket for library file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'library-files',
  'library-files',
  true,
  20971520, -- 20MB
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies — users can manage their own files (path: {user_id}/*)
CREATE POLICY "Users can upload library files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'library-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view library files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'library-files');

CREATE POLICY "Users can delete their library files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'library-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
