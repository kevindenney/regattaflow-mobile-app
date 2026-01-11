-- Clean up all remaining duplicate NOR documents for race ca59e269-d4d9-490e-bfd7-f230416d082d
-- Keep only the most recent one: 134612ee-6a25-4ad0-94be-2f1681b98103

-- First delete from race_documents (child table)
DELETE FROM race_documents
WHERE document_id IN (
  '765b6e2b-a744-43ea-a1c8-7b00c45fd355',
  '2d335a00-236f-4168-b63e-120bc9d80dae',
  '020aea55-87ba-4e9f-96d1-3d78f512cc97',
  '40162d58-f163-47d8-94db-82b7a9939f75',
  'a607bc98-ded1-4873-ba6e-26c7cfd206a3',
  'aeeceabe-a9bb-41f5-802d-d92acd1945d9'
);

-- Then delete from documents (parent table)
DELETE FROM documents
WHERE id IN (
  '765b6e2b-a744-43ea-a1c8-7b00c45fd355',
  '2d335a00-236f-4168-b63e-120bc9d80dae',
  '020aea55-87ba-4e9f-96d1-3d78f512cc97',
  '40162d58-f163-47d8-94db-82b7a9939f75',
  'a607bc98-ded1-4873-ba6e-26c7cfd206a3',
  'aeeceabe-a9bb-41f5-802d-d92acd1945d9'
);
