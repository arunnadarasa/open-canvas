import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { moveName, description, videoHash, creator, royaltyPercent } =
      await req.json();

    if (!moveName || !creator) {
      return new Response(
        JSON.stringify({ error: "moveName and creator are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const metadata = {
      name: moveName,
      symbol: "MOVE",
      description: description || `Dance move NFT: ${moveName}`,
      image: "",
      external_url: "https://moveregistry.lovable.app",
      attributes: [
        { trait_type: "Creator", value: creator },
        { trait_type: "Royalty", value: `${royaltyPercent ?? 5}%` },
        { trait_type: "Video Hash", value: videoHash || "" },
      ],
      properties: {
        category: "video",
        creators: [{ address: creator, share: 100 }],
      },
      seller_fee_basis_points: (royaltyPercent ?? 5) * 100,
    };

    // Store in Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const fileName = `${crypto.randomUUID()}.json`;
    const filePath = `metadata/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("nft-metadata")
      .upload(filePath, JSON.stringify(metadata, null, 2), {
        contentType: "application/json",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: urlData } = supabase.storage
      .from("nft-metadata")
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({ uri: urlData.publicUrl, metadata }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("nft-metadata error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
