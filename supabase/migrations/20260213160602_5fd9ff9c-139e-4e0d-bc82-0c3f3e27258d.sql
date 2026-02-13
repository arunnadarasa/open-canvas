
CREATE TABLE public.moltbook_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL UNIQUE,
  agent_name text NOT NULL,
  api_key text NOT NULL,
  claim_url text,
  claimed boolean NOT NULL DEFAULT false,
  moltbook_post_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.moltbook_agents ENABLE ROW LEVEL SECURITY;

-- Service-role only: no public access policies. Edge functions use service role key.
