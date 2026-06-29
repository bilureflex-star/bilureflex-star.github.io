import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  const token = btoa(str).replace(/[+/=]/g, "").slice(0, 32);
  return `dm_live_${token}`;
}

const ADMIN_ROLES = ["owner", "admin"] as const;

async function assertOrgAdmin(
  supabase: { from: (t: string) => any },
  organizationId: string,
  userId: string,
) {
  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!member || !ADMIN_ROLES.includes(member.role)) {
    throw new Error("Você não tem permissão de administrador nesta organização.");
  }
}

/** Create a new API key for an organization. Returns the plaintext key ONCE. */
export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        organizationId: z.string().uuid(),
        name: z.string().min(1).max(80),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertOrgAdmin(supabase, data.organizationId, userId);

    const raw = generateApiKey();
    const key_hash = await sha256Hex(raw);
    const key_prefix = raw.slice(0, 12);

    const { data: inserted, error } = await supabase
      .from("api_keys")
      .insert({
        organization_id: data.organizationId,
        name: data.name,
        key_prefix,
        key_hash,
        created_by: userId,
      })
      .select("id, name, key_prefix, created_at")
      .single();
    if (error) throw new Error(error.message);

    return { key: raw, record: inserted };
  });

/** Add a member to an organization by email (must already have an account). */
export const addOrgMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        organizationId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(["admin", "member"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertOrgAdmin(supabase, data.organizationId, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .ilike("email", data.email)
      .maybeSingle();
    if (!profile) {
      throw new Error("Nenhum usuário com este e-mail. Ele precisa criar uma conta primeiro.");
    }

    const { error } = await supabaseAdmin.from("organization_members").insert({
      organization_id: data.organizationId,
      user_id: profile.id,
      role: data.role,
    });
    if (error) {
      if (error.code === "23505") throw new Error("Este usuário já é membro da organização.");
      throw new Error(error.message);
    }

    return {
      user_id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: data.role,
    };
  });