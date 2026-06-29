import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "authorization, x-api-key, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extractKey(request: Request): string {
  const auth = request.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return (request.headers.get("x-api-key") ?? "").trim();
}

export const Route = createFileRoute("/api/public/v1/documents")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const key = extractKey(request);
        if (!key) return json({ error: "Chave de API ausente." }, 401);

        const keyHash = await sha256Hex(key);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: apiKey } = await supabaseAdmin
          .from("api_keys")
          .select("id, organization_id, revoked_at")
          .eq("key_hash", keyHash)
          .maybeSingle();

        if (!apiKey || apiKey.revoked_at) {
          return json({ error: "Chave de API inválida ou revogada." }, 401);
        }

        await supabaseAdmin
          .from("api_keys")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", apiKey.id);

        const url = new URL(request.url);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 100);

        const { data: docs, error } = await supabaseAdmin
          .from("documents")
          .select("id, title, module, doc_type, norm, status, created_at, updated_at")
          .eq("organization_id", apiKey.organization_id)
          .order("updated_at", { ascending: false })
          .limit(limit);

        if (error) return json({ error: "Erro ao buscar documentos." }, 500);

        return json({ data: docs ?? [], count: docs?.length ?? 0 });
      },
    },
  },
});