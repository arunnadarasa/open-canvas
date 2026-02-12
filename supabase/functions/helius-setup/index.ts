const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const heliusApiKey = Deno.env.get('HELIUS_API_KEY');
    if (!heliusApiKey) {
      throw new Error('HELIUS_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const webhookURL = `${supabaseUrl}/functions/v1/helius-webhook`;
    const programId = 'Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ';

    // First, list existing webhooks to avoid duplicates
    const listRes = await fetch(
      `https://api.helius.xyz/v0/webhooks?api-key=${heliusApiKey}`
    );
    const existing = await listRes.json();

    if (Array.isArray(existing)) {
      const alreadyExists = existing.find(
        (w: any) => w.webhookURL === webhookURL
      );
      if (alreadyExists) {
        return new Response(
          JSON.stringify({
            ok: true,
            message: 'Webhook already registered',
            webhookId: alreadyExists.webhookID,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Register new webhook
    const res = await fetch(
      `https://api.helius.xyz/v0/webhooks?api-key=${heliusApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookURL,
          transactionTypes: ['ANY'],
          accountAddresses: [programId],
          webhookType: 'enhanced',
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Helius API error [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Webhook registered successfully',
        webhookId: data.webhookID,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Helius setup error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
