import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Helius sends an array of transaction objects
    const transactions = Array.isArray(body) ? body : [body];

    const events: Array<{
      mint_pubkey: string;
      payer_wallet: string;
      amount: number;
      royalty_amount: number;
      tx_signature: string;
    }> = [];

    for (const tx of transactions) {
      // Parse log messages looking for SkillLicensed event data
      const logs: string[] = tx.meta?.logMessages || tx.logMessages || [];
      const signature = tx.transaction?.signatures?.[0] || tx.signature || '';

      for (const log of logs) {
        // Anchor events are base64-encoded in program logs with prefix "Program data:"
        if (log.includes('Program data:')) {
          try {
            // For simplicity, we look for SkillLicensed patterns in the parsed accounts
            // A production implementation would decode the Anchor event from base64
            // For now, we extract from Helius enhanced transaction format
          } catch {
            // skip unparseable
          }
        }
      }

      // Helius enhanced format includes events directly
      if (tx.events?.skillLicensed || tx.type === 'SKILL_LICENSED') {
        const event = tx.events?.skillLicensed || tx;
        events.push({
          mint_pubkey: event.mint || '',
          payer_wallet: event.payer || '',
          amount: Number(event.amount || 0),
          royalty_amount: Number(event.royalty || 0),
          tx_signature: signature,
        });
      }

      // Also handle Helius "TRANSACTION" webhook format with instruction parsing
      if (tx.accountData || tx.nativeTransfers || tx.tokenTransfers) {
        // Check if this transaction interacted with the MoveRegistry program
        const programId = 'Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ';
        const instructions = tx.instructions || [];
        const isOurProgram = instructions.some((ix: any) => ix.programId === programId);

        if (isOurProgram) {
          // Extract token transfers as royalty events
          const tokenTransfers = tx.tokenTransfers || [];
          for (const transfer of tokenTransfers) {
            events.push({
              mint_pubkey: transfer.mint || '',
              payer_wallet: transfer.fromUserAccount || '',
              amount: Number(transfer.tokenAmount || 0),
              royalty_amount: Number(transfer.tokenAmount || 0),
              tx_signature: signature,
            });
          }
        }
      }
    }

    if (events.length > 0) {
      const { error } = await supabase.from('royalty_events').insert(events);
      if (error) {
        console.error('Insert error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: events.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
