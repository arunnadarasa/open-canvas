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
    const { wallet_address, agent_name, description } = await req.json();

    // wallet_address is now optional (Moltbook gate happens before wallet connect)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if already registered (only if wallet provided)
    if (wallet_address) {
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
    }

    // Determine agent name and description
    let finalName = agent_name?.trim();
    if (finalName) {
      // Server-side validation
      if (finalName.length < 3 || finalName.length > 30 || !/^[a-zA-Z0-9_-]+$/.test(finalName)) {
        return new Response(
          JSON.stringify({ error: "Agent name must be 3-30 chars, alphanumeric/hyphens/underscores only" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const suffix = Date.now().toString(36).slice(-4);
      finalName = wallet_address ? `MR-${wallet_address.slice(0, 6)}-${suffix}` : `MR-${suffix}`;
    }

    const finalDesc = description?.trim()?.slice(0, 200) ||
      `MoveRegistry dance skill creator. Human-verified via World ID + ClawKey.`;

    const registerRes = await fetch(`${MOLTBOOK_API}/agents/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: finalName,
        description: finalDesc,
      }),
    });

    const registerText = await registerRes.text();
    console.log("Moltbook register response:", registerRes.status, registerText);

    if (!registerRes.ok) {
      return new Response(
        JSON.stringify({ error: `Moltbook registration failed: ${registerText}` }),
        { status: registerRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let registerData: Record<string, any>;
    try {
      registerData = JSON.parse(registerText);
    } catch {
      return new Response(
        JSON.stringify({ error: `Invalid response from Moltbook: ${registerText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract from nested agent object
    const agent = registerData.agent || {};
    const apiKey = agent.api_key || registerData.api_key || "";
    const claimUrl = agent.claim_url || registerData.claim_url || "";

    if (!apiKey) {
      console.error("No api_key found in Moltbook response. Full response:", JSON.stringify(registerData));
      return new Response(
        JSON.stringify({
          error: "Moltbook registration succeeded but no API key was returned",
          debug_fields: Object.keys(registerData),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Subscribe agent to dancetech submolt (required before posting)
    try {
      const subRes = await fetch(`${MOLTBOOK_API}/submolts/dancetech/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (!subRes.ok) {
        console.warn("Submolt subscribe failed (non-blocking):", await subRes.text());
      } else {
        console.log("Agent subscribed to dancetech submolt");
      }
    } catch (subErr) {
      console.warn("Submolt subscribe error (non-blocking):", subErr);
    }

    // Store in database (api_key never returned to client)
    const { error: insertError } = await supabase
      .from("moltbook_agents")
      .insert({
        ...(wallet_address ? { wallet_address } : {}),
        agent_name: finalName,
        api_key: apiKey,
        claim_url: claimUrl || null,
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
        agent_name: finalName,
        claim_url: claimUrl,
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
