import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std/http/server.ts";

// Your Supabase URL and Service Role Key should be set as environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Function to call Supabase's RPC endpoint
async function querySupabaseRpc(payload: object) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/find_similar_documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase RPC request failed: ${errorText}`);
  }

  return await response.json();
}

// Create an instance for the OpenAI model (text-embedding-ada-002)
const model = new Supabase.ai.Session("text-embedding-ada-002");

Deno.serve(async (req) => {
  // Parse the incoming JSON request body
  const { search } = await req.json();

  // Return error if search term is missing
  if (!search) return new Response("Please provide a search param!", { status: 400 });

  // Generate embedding for the search term using the OpenAI model
  const embedding = await model.run(search, {
    mean_pool: true,
    normalize: true,
  });

  // Query Supabase for similar documents
  try {
    const result = await querySupabaseRpc({
      embedding: JSON.stringify(embedding),
      match_threshold: 0.8,
    });

    return new Response(JSON.stringify({ search, result }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
