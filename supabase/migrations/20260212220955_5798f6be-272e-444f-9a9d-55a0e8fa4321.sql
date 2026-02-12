-- Tighten the INSERT policy to service_role only
DROP POLICY IF EXISTS "Service role can upload metadata" ON storage.objects;

CREATE POLICY "Service role can upload metadata"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nft-metadata' AND auth.role() = 'service_role');
