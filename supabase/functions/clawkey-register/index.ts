import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address } = await req.json();
    if (!wallet_address) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate Ed25519 key pair
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );

    // Export public key as SPKI DER -> base64
    const publicKeyDer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyBase64 = arrayBufferToBase64(publicKeyDer);

    // Build challenge
    const timestamp = Date.now();
    const message = `clawkey-register-${timestamp}`;
    const messageBytes = new TextEncoder().encode(message);

    // Sign the message
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      keyPair.privateKey,
      messageBytes
    );
    const signatureBase64 = arrayBufferToBase64(signature);

    const challenge = {
      deviceId: wallet_address,
      publicKey: publicKeyBase64,
      message,
      signature: signatureBase64,
      timestamp,
    };

    // Call ClawKey API
    const clawRes = await fetch('https://api.clawkey.ai/v1/agent/register/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(challenge),
    });

    const clawData = await clawRes.json();

    if (!clawRes.ok) {
      return new Response(
        JSON.stringify({ error: clawData.error || 'ClawKey registration failed', details: clawData }),
        { status: clawRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store in database via service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('clawkey_agents').upsert(
      {
        wallet_address,
        device_id: wallet_address,
        public_key: publicKeyBase64,
        session_id: clawData.sessionId,
        verified: false,
      },
      { onConflict: 'wallet_address' }
    );

    return new Response(
      JSON.stringify({
        sessionId: clawData.sessionId,
        registrationUrl: clawData.registrationUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
