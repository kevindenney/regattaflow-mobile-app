-- Clean up duplicate NOR documents for race ca59e269-d4d9-490e-bfd7-f230416d082d
-- Keep the most recent one: 134612ee-6a25-4ad0-94be-2f1681b98103

-- First delete from race_documents (child table)
DELETE FROM race_documents
WHERE document_id IN (
  'e2f41d42-5e6e-46f6-bb86-f35a984c67a9',
  'bf059ed2-1b63-4f46-bae5-aee0425a7fad',
  '477f3514-5597-43b4-9883-67550eb51bcf',
  '53e50544-f94f-4fea-95f0-1fa7e5b66372'
);

-- Then delete from documents (parent table)
DELETE FROM documents
WHERE id IN (
  'e2f41d42-5e6e-46f6-bb86-f35a984c67a9',
  'bf059ed2-1b63-4f46-bae5-aee0425a7fad',
  '477f3514-5597-43b4-9883-67550eb51bcf',
  '53e50544-f94f-4fea-95f0-1fa7e5b66372'
);
