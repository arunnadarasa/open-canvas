
-- Table: minted_moves
CREATE TABLE public.minted_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_wallet text NOT NULL,
  move_name text NOT NULL,
  expression text,
  royalty_percent smallint NOT NULL DEFAULT 10,
  mint_pubkey text,
  skill_pda text,
  tx_signature text,
  payment_method text NOT NULL DEFAULT 'usdc',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: royalty_events
CREATE TABLE public.royalty_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_pubkey text NOT NULL,
  payer_wallet text NOT NULL,
  amount bigint NOT NULL,
  royalty_amount bigint NOT NULL,
  tx_signature text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: public reads, service-role writes
ALTER TABLE public.minted_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read minted_moves"
  ON public.minted_moves FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert minted_moves"
  ON public.minted_moves FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read royalty_events"
  ON public.royalty_events FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert royalty_events"
  ON public.royalty_events FOR INSERT
  WITH CHECK (true);
