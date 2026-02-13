import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MOLTBOOK_API = "https://www.moltbook.com/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address } = await req.json();

    if (!wallet_address) {
      return new Response(
        JSON.stringify({ error: "wallet_address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if already registered
    const { data: existing } = await supabase
      .from("moltbook_agents")
      .select("agent_name, claim_url, claimed")
      .eq("wallet_address", wallet_address)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          agent_name: existing.agent_name,
          claim_url: existing.claim_url,
          claimed: existing.claimed,
          already_registered: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Register new agent on Moltbook
    const agentName = `MR-${wallet_address.slice(0, 8)}`;

    const registerRes = await fetch(`${MOLTBOOK_API}/agents/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: agentName,
        description: `MoveRegistry dance skill creator (wallet: ${wallet_address.slice(0, 8)}...). Human-verified via World ID + ClawKey.`,
      }),
    });

    if (!registerRes.ok) {
      const errText = await registerRes.text();
      return new Response(
        JSON.stringify({ error: `Moltbook registration failed: ${errText}` }),
        { status: registerRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const registerData = await registerRes.json();

    // Store in database (api_key never returned to client)
    const { error: insertError } = await supabase
      .from("moltbook_agents")
      .insert({
        wallet_address,
        agent_name: agentName,
        api_key: registerData.api_key,
        claim_url: registerData.claim_url,
      });

    if (insertError) {
      console.error("DB insert error:", insertError);
      return new Response(
        JSON.stringify({ error: `Database error: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        agent_name: agentName,
        claim_url: registerData.claim_url,
        claimed: false,
        already_registered: false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("moltbook-register error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
