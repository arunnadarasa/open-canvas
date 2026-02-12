import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, paymentSignature, method } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build headers for the upstream request
    const upstreamHeaders: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (paymentSignature) {
      upstreamHeaders['PAYMENT-SIGNATURE'] = paymentSignature;
    }

    const upstreamMethod = method || (paymentSignature ? 'GET' : 'GET');

    console.log(`Proxying ${upstreamMethod} to ${url}`);
    if (paymentSignature) {
      console.log(`PAYMENT-SIGNATURE header length: ${paymentSignature.length}`);
    }

    const response = await fetch(url, {
      method: upstreamMethod,
      headers: upstreamHeaders,
    });

    const responseText = await response.text();
    console.log(`Upstream responded: ${response.status}`);
    console.log(`Response body (first 500): ${responseText.slice(0, 500)}`);

    // Try to parse as JSON, otherwise return as text
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(responseText);
    } catch {
      parsedBody = { raw: responseText };
    }

    // Always return 200 from the proxy — include upstream status so client can interpret
    const wrappedResponse = {
      upstreamStatus: response.status,
      ...parsedBody,
    };

    return new Response(JSON.stringify(wrappedResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('x402-proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Proxy error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
