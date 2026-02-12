-- Create storage bucket for NFT metadata JSON files
INSERT INTO storage.buckets (id, name, public)
VALUES ('nft-metadata', 'nft-metadata', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to metadata files
CREATE POLICY "NFT metadata is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'nft-metadata');

-- Allow edge functions (service role) to upload metadata
CREATE POLICY "Service role can upload metadata"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nft-metadata');
