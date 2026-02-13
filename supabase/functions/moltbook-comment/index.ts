import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MOLTBOOK_API = "https://www.moltbook.com/api/v1";
// The anchor post ID on /m/dancetech — set after creating the initial post
const DANCETECH_ANCHOR_POST_ID = Deno.env.get("MOLTBOOK_ANCHOR_POST_ID") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address, moveName, creator, mintPubkey, expression, videoHashCid, royaltyPercent } =
      await req.json();

    if (!wallet_address || !moveName) {
      return new Response(
        JSON.stringify({ error: "wallet_address and moveName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Look up user's API key
    const { data: agent } = await supabase
      .from("moltbook_agents")
      .select("api_key")
      .eq("wallet_address", wallet_address)
      .maybeSingle();

    if (!agent?.api_key) {
      // User hasn't registered with Moltbook — skip silently
      return new Response(
        JSON.stringify({ skipped: true, reason: "No Moltbook agent for this wallet" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure agent is subscribed to dancetech (idempotent safety net)
    try {
      await fetch(`${MOLTBOOK_API}/submolts/dancetech/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${agent.api_key}`,
        },
      });
    } catch (subErr) {
      console.warn("Submolt subscribe check failed (non-blocking):", subErr);
    }

    // Build comment content
    const content = [
      `🎯 **New Move Minted: ${moveName}**`,
      "",
      `**Creator:** \`${creator || wallet_address}\``,
      `**Royalty:** ${royaltyPercent ?? 5}%`,
      mintPubkey ? `**Mint:** \`${mintPubkey}\`` : null,
      videoHashCid ? `**Video CID:** \`${videoHashCid}\`` : null,
      "",
      "```",
      expression || "N/A",
      "```",
      "",
      `[View on MoveRegistry](https://moveregistry.lovable.app)`,
    ].filter(Boolean).join("\n");

    // Post as a comment under the anchor post, or as a standalone post if no anchor
    let endpoint: string;
    let body: Record<string, unknown>;

    if (DANCETECH_ANCHOR_POST_ID) {
      endpoint = `${MOLTBOOK_API}/posts/${DANCETECH_ANCHOR_POST_ID}/comments`;
      body = { content };
    } else {
      // Fallback: post to the dancetech submolt directly
      endpoint = `${MOLTBOOK_API}/posts`;
      body = {
        submolt: "dancetech",
        title: `New Move: ${moveName}`,
        content,
        url: "https://moveregistry.lovable.app",
      };
    }

    const postRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${agent.api_key}`,
      },
      body: JSON.stringify(body),
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      // Check for rate limit
      if (postRes.status === 429) {
        console.warn("Moltbook rate limited, skipping:", errText);
        return new Response(
          JSON.stringify({ skipped: true, reason: "Rate limited" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Moltbook comment failed:", errText);
      return new Response(
        JSON.stringify({ error: `Moltbook comment failed: ${errText}` }),
        { status: postRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const postData = await postRes.json();

    return new Response(
      JSON.stringify({ success: true, post: postData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("moltbook-comment error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
