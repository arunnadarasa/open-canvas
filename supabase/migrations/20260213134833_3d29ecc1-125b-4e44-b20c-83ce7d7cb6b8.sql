
-- Create clawkey_agents table
CREATE TABLE public.clawkey_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  device_id text,
  public_key text,
  session_id text,
  verified boolean NOT NULL DEFAULT false,
  registered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clawkey_agents ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can check verification status
CREATE POLICY "Anyone can read clawkey_agents"
ON public.clawkey_agents
FOR SELECT
USING (true);

-- Only service role can insert (edge functions)
CREATE POLICY "Service role can insert clawkey_agents"
ON public.clawkey_agents
FOR INSERT
WITH CHECK (true);

-- Only service role can update (edge functions)
CREATE POLICY "Service role can update clawkey_agents"
ON public.clawkey_agents
FOR UPDATE
USING (true);
