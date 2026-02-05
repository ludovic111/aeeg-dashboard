-- Switch meeting agenda uploads to DOCX files
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[],
  file_size_limit = 10485760
WHERE id = 'meeting-agendas';
