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

    // Look up user's API key
    const { data: agent } = await supabase
      .from("moltbook_agents")
      .select("api_key, moltbook_post_id")
      .eq("wallet_address", wallet_address)
      .maybeSingle();

    if (!agent?.api_key) {
      return new Response(
        JSON.stringify({ error: "No Moltbook agent found for this wallet" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (agent.moltbook_post_id) {
      return new Response(
        JSON.stringify({ already_posted: true, post_id: agent.moltbook_post_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create anchor post on /m/dancetech
    const postRes = await fetch(`${MOLTBOOK_API}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${agent.api_key}`,
      },
      body: JSON.stringify({
        submolt: "dancetech",
        title: "🎭 MoveRegistry — On-Chain Dance Skill Registry",
        content: [
          "Welcome to **MoveRegistry** on the dancetech submolt!",
          "",
          "This is the anchor post for the on-chain dance skill registry built on Solana.",
          "Every dance move minted as an NFT will appear as a comment below, creating a chronological audit trail.",
          "",
          "**Verification Stack:**",
          "- 🌍 World ID — proof-of-personhood",
          "- 🔑 ClawKey — verifiable human ownership",
          "- 💳 x402 — micropayment verification",
          "",
          `[Visit MoveRegistry](https://moveregistry.lovable.app)`,
        ].join("\n"),
        url: "https://moveregistry.lovable.app",
      }),
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      return new Response(
        JSON.stringify({ error: `Moltbook post failed: ${errText}` }),
        { status: postRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const postData = await postRes.json();
    const postId = postData.id || postData.post_id || "";

    // Store the post ID
    if (postId) {
      await supabase
        .from("moltbook_agents")
        .update({ moltbook_post_id: postId })
        .eq("wallet_address", wallet_address);
    }

    return new Response(
      JSON.stringify({ success: true, post: postData, post_id: postId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("moltbook-post error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
