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
    const apiKey = Deno.env.get("MOLTBOOK_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "MOLTBOOK_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { moveName, creator, royaltyPercent, mintPubkey, expression, videoHashCid } =
      await req.json();

    if (!moveName || !creator) {
      return new Response(
        JSON.stringify({ error: "moveName and creator are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = [
      `**Creator:** \`${creator}\``,
      `**Royalty:** ${royaltyPercent ?? 5}%`,
      mintPubkey ? `**Mint:** \`${mintPubkey}\`` : null,
      videoHashCid ? `**Video CID:** \`${videoHashCid}\`` : null,
      "",
      "```",
      expression || "N/A",
      "```",
      "",
      `[View on MoveRegistry](https://moveregistry.lovable.app)`,
    ]
      .filter(Boolean)
      .join("\n");

    const postRes = await fetch(`${MOLTBOOK_API}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        submolt: "moveclaw",
        title: `New Move: ${moveName}`,
        content,
        url: "https://moveregistry.lovable.app",
      }),
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      console.error("Moltbook post failed:", errText);
      return new Response(
        JSON.stringify({ error: `Moltbook post failed: ${errText}` }),
        { status: postRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const postData = await postRes.json();

    return new Response(
      JSON.stringify({ success: true, post: postData }),
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
