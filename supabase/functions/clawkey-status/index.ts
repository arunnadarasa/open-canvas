import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check status with ClawKey
    const statusRes = await fetch(
      `https://api.clawkey.ai/v1/agent/register/${sessionId}/status`
    );
    const statusData = await statusRes.json();

    if (!statusRes.ok) {
      return new Response(
        JSON.stringify({ error: statusData.error || 'Status check failed', details: statusData }),
        { status: statusRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If completed, update database
    if (statusData.status === 'completed') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await supabase
        .from('clawkey_agents')
        .update({ verified: true, registered_at: new Date().toISOString() })
        .eq('session_id', sessionId);
    }

    return new Response(
      JSON.stringify({ status: statusData.status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
