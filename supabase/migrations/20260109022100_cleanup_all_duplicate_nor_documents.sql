-- Clean up all duplicate NOR documents for race ca59e269-d4d9-490e-bfd7-f230416d082d
-- Keep only the most recent one: d7415f8b-1f21-4a3d-bd53-81a6ed69bea8

-- Delete from race_documents (child table)
DELETE FROM race_documents
WHERE id IN (
  '97d8a569-592e-46b9-99ce-d4ae30066aae',
  'c9bfce6d-497b-4373-bbcc-9f538770d248',
  '16815f12-cd2d-4ce1-aa83-d6433c5202ee',
  'e4d3d9eb-8d27-4b41-bcb5-02389b2cc07c'
);

-- Delete from documents (parent table)
DELETE FROM documents
WHERE id IN (
  'f799ea8f-8a58-4f8c-a354-a83ba0890004',
  'babcaded-1009-4ec8-b2d6-32c6c97dc069',
  '58c2f0e6-0d11-4e9d-ae66-049203b36db3',
  '134612ee-6a25-4ad0-94be-2f1681b98103'
);
