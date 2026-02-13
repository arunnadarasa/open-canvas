
-- Enable RLS on moltbook_agents
ALTER TABLE public.moltbook_agents ENABLE ROW LEVEL SECURITY;

-- Deny direct SELECT to protect api_key
CREATE POLICY "No direct client reads"
  ON public.moltbook_agents FOR SELECT
  USING (false);

-- Service role can still do everything via INSERT/UPDATE
CREATE POLICY "Service role can insert moltbook_agents"
  ON public.moltbook_agents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update moltbook_agents"
  ON public.moltbook_agents FOR UPDATE
  USING (true);

-- Create a public view excluding api_key
CREATE VIEW public.moltbook_agents_public
WITH (security_invoker = on) AS
  SELECT wallet_address, agent_name, claim_url, claimed, created_at
  FROM public.moltbook_agents;

-- Grant access to the view
GRANT SELECT ON public.moltbook_agents_public TO anon, authenticated;
