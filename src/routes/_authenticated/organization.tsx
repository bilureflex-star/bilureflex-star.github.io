import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createApiKey, addOrgMember } from "@/lib/org.functions";
import { AppHeader } from "@/components/app/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  Palette,
  Users,
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/organization")({
  component: OrganizationPage,
});

interface Org {
  id: string;
  name: string;
  slug: string;
  brand_name: string | null;
  logo_url: string | null;
  primary_color: string;
  plan: string;
}
interface Membership extends Org {
  role: "owner" | "admin" | "member";
}
interface Member {
  user_id: string;
  role: string;
  email: string | null;
  full_name: string | null;
}
interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function OrganizationPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Membership[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  async function loadOrgs() {
    const { data: u } = await supabase.auth.getUser();
    setEmail(u.user?.email ?? null);
    setUid(u.user?.id ?? null);
    const { data: rows } = await supabase
      .from("organization_members")
      .select("role, organizations(id, name, slug, brand_name, logo_url, primary_color, plan)")
      .order("created_at", { ascending: true });
    const list: Membership[] = (rows ?? [])
      .filter((r: any) => r.organizations)
      .map((r: any) => ({ role: r.role, ...r.organizations }));
    setOrgs(list);
    setActiveId((prev) => prev ?? list[0]?.id ?? null);
  }

  useEffect(() => {
    loadOrgs();
  }, []);

  const active = orgs?.find((o) => o.id === activeId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <AppHeader email={email} />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Building2 className="h-7 w-7 text-primary" /> Enterprise
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie organizações, marca própria, equipe e acesso à API.
            </p>
          </div>
          {orgs && orgs.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={activeId ?? undefined} onValueChange={setActiveId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CreateOrgButton uid={uid} onCreated={loadOrgs} />
            </div>
          )}
        </div>

        <div className="mt-8">
          {orgs === null ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : orgs.length === 0 ? (
            <EmptyState uid={uid} onCreated={loadOrgs} />
          ) : active ? (
            <OrgDetail org={active} uid={uid} onChange={loadOrgs} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ uid, onCreated }: { uid: string | null; onCreated: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 border-dashed py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Building2 className="h-7 w-7 text-primary" />
      </div>
      <div>
        <p className="font-display text-lg font-semibold">Nenhuma organização ainda</p>
        <p className="text-sm text-muted-foreground">
          Crie uma organização para habilitar marca própria, equipe e API.
        </p>
      </div>
      <CreateOrgButton uid={uid} onCreated={onCreated} />
    </Card>
  );
}

function CreateOrgButton({ uid, onCreated }: { uid: string | null; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!uid || !name.trim()) return;
    setSaving(true);
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase
      .from("organizations")
      .insert({ name: name.trim(), slug, created_by: uid });
    setSaving(false);
    if (error) {
      toast.error("Erro ao criar organização.");
      return;
    }
    setName("");
    toast.success("Organização criada.");
    onCreated();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova organização
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nova organização</AlertDialogTitle>
          <AlertDialogDescription>
            Dê um nome para sua empresa ou instituição.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="org-name">Nome</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Universidade Exemplo"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={saving || !name.trim()} onClick={create}>
            Criar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function OrgDetail({
  org,
  uid,
  onChange,
}: {
  org: Membership;
  uid: string | null;
  onChange: () => void;
}) {
  const isAdmin = org.role === "owner" || org.role === "admin";
  return (
    <Tabs defaultValue="brand">
      <TabsList>
        <TabsTrigger value="brand">
          <Palette className="mr-1.5 h-4 w-4" /> Marca
        </TabsTrigger>
        <TabsTrigger value="members">
          <Users className="mr-1.5 h-4 w-4" /> Equipe
        </TabsTrigger>
        <TabsTrigger value="api">
          <KeyRound className="mr-1.5 h-4 w-4" /> API
        </TabsTrigger>
      </TabsList>
      <TabsContent value="brand" className="mt-6">
        <BrandTab org={org} isAdmin={isAdmin} onChange={onChange} />
      </TabsContent>
      <TabsContent value="members" className="mt-6">
        <MembersTab org={org} uid={uid} isAdmin={isAdmin} />
      </TabsContent>
      <TabsContent value="api" className="mt-6">
        <ApiTab org={org} isAdmin={isAdmin} />
      </TabsContent>
    </Tabs>
  );
}

function BrandTab({
  org,
  isAdmin,
  onChange,
}: {
  org: Membership;
  isAdmin: boolean;
  onChange: () => void;
}) {
  const [brandName, setBrandName] = useState(org.brand_name ?? "");
  const [logoUrl, setLogoUrl] = useState(org.logo_url ?? "");
  const [color, setColor] = useState(org.primary_color || "#10b981");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBrandName(org.brand_name ?? "");
    setLogoUrl(org.logo_url ?? "");
    setColor(org.primary_color || "#10b981");
  }, [org.id, org.brand_name, org.logo_url, org.primary_color]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        brand_name: brandName.trim() || null,
        logo_url: logoUrl.trim() || null,
        primary_color: color,
      })
      .eq("id", org.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar.");
      return;
    }
    toast.success("Marca atualizada.");
    onChange();
  }

  return (
    <Card className="p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Nome da marca (white label)</Label>
            <Input
              id="brand"
              disabled={!isAdmin}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder={org.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">URL do logo</Label>
            <Input
              id="logo"
              disabled={!isAdmin}
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Cor principal</Label>
            <div className="flex items-center gap-3">
              <input
                id="color"
                type="color"
                disabled={!isAdmin}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent"
              />
              <Input
                disabled={!isAdmin}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="max-w-[140px]"
              />
            </div>
          </div>
          {isAdmin && (
            <Button disabled={saving} onClick={save}>
              Salvar marca
            </Button>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Pré-visualização</p>
          <div className="rounded-xl border border-border p-5">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-9 w-9 rounded-md object-contain"
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-md font-display font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {(brandName || org.name).charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-display text-lg font-bold">
                {brandName || org.name}
              </span>
            </div>
            <Button
              className="mt-4 w-full text-white"
              style={{ backgroundColor: color }}
            >
              Botão de marca
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MembersTab({
  org,
  uid,
  isAdmin,
}: {
  org: Membership;
  uid: string | null;
  isAdmin: boolean;
}) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const addMember = useServerFn(addOrgMember);

  async function load() {
    const { data: rows } = await supabase
      .from("organization_members")
      .select("user_id, role, profiles(email, full_name)")
      .eq("organization_id", org.id);
    setMembers(
      (rows ?? []).map((r: any) => ({
        user_id: r.user_id,
        role: r.role,
        email: r.profiles?.email ?? null,
        full_name: r.profiles?.full_name ?? null,
      })),
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id]);

  async function invite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await addMember({
        data: { organizationId: org.id, email: inviteEmail.trim(), role: inviteRole },
      });
      toast.success("Membro adicionado.");
      setInviteEmail("");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao adicionar membro.");
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(userId: string) {
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", org.id)
      .eq("user_id", userId);
    if (error) {
      toast.error("Erro ao remover membro.");
      return;
    }
    setMembers((m) => m?.filter((x) => x.user_id !== userId) ?? null);
    toast.success("Membro removido.");
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card className="p-5">
          <p className="font-display font-semibold">Adicionar membro</p>
          <p className="mb-3 text-sm text-muted-foreground">
            O usuário precisa ter uma conta no DocMaster AI.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite">E-mail</Label>
              <Input
                id="invite"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="pessoa@exemplo.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button disabled={inviting || !inviteEmail.trim()} onClick={invite}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </div>
        </Card>
      )}

      <Card className="divide-y divide-border">
        {members === null ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        ) : (
          members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{m.full_name || m.email || m.user_id}</p>
                {m.full_name && (
                  <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.role === "owner" ? "default" : "secondary"}>
                  {ROLE_LABEL[m.role] ?? m.role}
                </Badge>
                {isAdmin && m.role !== "owner" && m.user_id !== uid && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => removeMember(m.user_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

function ApiTab({ org, isAdmin }: { org: Membership; isAdmin: boolean }) {
  const [keys, setKeys] = useState<ApiKeyRow[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createKey = useServerFn(createApiKey);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function load() {
    const { data: rows } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, last_used_at, revoked_at, created_at")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });
    setKeys((rows as ApiKeyRow[]) ?? []);
  }

  useEffect(() => {
    load();
    setNewKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id]);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await createKey({ data: { organizationId: org.id, name: name.trim() } });
      setNewKey(res.key);
      setName("");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar chave.");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    const { error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao revogar.");
      return;
    }
    toast.success("Chave revogada.");
    load();
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card className="p-5">
          <p className="font-display font-semibold">Nova chave de API</p>
          <p className="mb-3 text-sm text-muted-foreground">
            Use a chave para acessar a API pública do DocMaster AI.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="keyname">Nome da chave</Label>
              <Input
                id="keyname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Integração de produção"
              />
            </div>
            <Button disabled={creating || !name.trim()} onClick={create}>
              <Plus className="mr-2 h-4 w-4" /> Gerar chave
            </Button>
          </div>

          {newKey && (
            <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">
                Copie agora — esta chave não será exibida novamente.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-background px-3 py-2 font-mono text-sm">
                  {newKey}
                </code>
                <Button variant="outline" size="icon" onClick={copyKey}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="divide-y divide-border">
        {keys === null ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Nenhuma chave de API criada.</p>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{k.name}</p>
                <p className="truncate font-mono text-sm text-muted-foreground">
                  {k.key_prefix}••••
                </p>
              </div>
              <div className="flex items-center gap-2">
                {k.revoked_at ? (
                  <Badge variant="outline">Revogada</Badge>
                ) : (
                  <Badge variant="secondary">Ativa</Badge>
                )}
                {isAdmin && !k.revoked_at && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revogar chave?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Aplicações que usam esta chave deixarão de funcionar.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => revoke(k.id)}>
                          Revogar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      <Card className="p-5">
        <p className="flex items-center gap-2 font-display font-semibold">
          <Code2 className="h-4 w-4 text-primary" /> Documentação da API
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Liste os documentos da organização com sua chave de API.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-foreground/5 p-4 text-xs leading-relaxed">
          <code>{`curl ${origin}/api/public/v1/documents \\
  -H "Authorization: Bearer SUA_CHAVE_DE_API"`}</code>
        </pre>
      </Card>
    </div>
  );
}