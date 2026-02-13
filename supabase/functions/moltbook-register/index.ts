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
    // Step 1: Register the agent
    const registerRes = await fetch(`${MOLTBOOK_API}/agents/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "MoveRegistry",
        description:
          "Decentralized choreography skill registry on Solana — turning human dance moves into verifiable, licensable AI-agent skills.",
      }),
    });

    if (!registerRes.ok) {
      const errText = await registerRes.text();
      return new Response(
        JSON.stringify({ error: `Registration failed: ${errText}` }),
        { status: registerRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const registerData = await registerRes.json();
    // registerData should contain { api_key, claim_url }

    // Step 2: Create the submolt (using the new api_key)
    const apiKey = registerData.api_key;
    let submoltResult = null;

    if (apiKey) {
      const submoltRes = await fetch(`${MOLTBOOK_API}/submolts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          name: "moveclaw",
          display_name: "MoveClaw Registry",
          description:
            "Dance moves minted as NFTs on Solana. Choreography skills for AI agents, metaverse avatars, and robots.",
          allow_crypto: true,
        }),
      });

      if (submoltRes.ok) {
        submoltResult = await submoltRes.json();
      } else {
        const submoltErr = await submoltRes.text();
        submoltResult = { error: submoltErr };
      }
    }

    return new Response(
      JSON.stringify({
        message: "Agent registered. Save the api_key as MOLTBOOK_API_KEY secret, then visit claim_url to activate.",
        api_key: registerData.api_key,
        claim_url: registerData.claim_url,
        agent: registerData,
        submolt: submoltResult,
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
