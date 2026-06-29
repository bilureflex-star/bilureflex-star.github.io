import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Share2, Trash2, UserPlus, Users } from "lucide-react";

type Role = "viewer" | "editor";

interface Collaborator {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
}

const ROLE_LABEL: Record<Role, string> = { viewer: "Leitor", editor: "Editor" };

export function ShareDialog({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Collaborator[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data, error } = await supabase.rpc("get_document_collaborators", {
      _document_id: documentId,
    });
    if (error) {
      toast.error("Erro ao carregar colaboradores.");
      setList([]);
      return;
    }
    setList((data as Collaborator[]) ?? []);
  }

  function onOpenChange(v: boolean) {
    setOpen(v);
    if (v) {
      setList(null);
      load();
    }
  }

  async function invite() {
    const value = email.trim();
    if (!value) {
      toast.error("Informe um e-mail.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("add_collaborator", {
      _document_id: documentId,
      _email: value,
      _role: role,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Não foi possível convidar.");
      return;
    }
    toast.success("Colaborador adicionado.");
    setEmail("");
    load();
  }

  async function changeRole(userId: string, next: Role) {
    setList((l) => l?.map((c) => (c.user_id === userId ? { ...c, role: next } : c)) ?? null);
    const { error } = await supabase
      .from("document_collaborators")
      .update({ role: next })
      .eq("document_id", documentId)
      .eq("user_id", userId);
    if (error) {
      toast.error("Erro ao alterar permissão.");
      load();
    }
  }

  async function remove(userId: string) {
    setList((l) => l?.filter((c) => c.user_id !== userId) ?? null);
    const { error } = await supabase
      .from("document_collaborators")
      .delete()
      .eq("document_id", documentId)
      .eq("user_id", userId);
    if (error) {
      toast.error("Erro ao remover colaborador.");
      load();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-1 h-4 w-4" /> Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Users className="h-5 w-5 text-primary" /> Compartilhar documento
          </DialogTitle>
          <DialogDescription>
            Convide pessoas por e-mail. Leitores apenas visualizam; editores podem alterar o conteúdo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && invite()}
            />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Leitor</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={invite} disabled={busy} size="icon">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mt-2 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pessoas com acesso
          </p>
          {list === null ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : list.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              Ainda não há colaboradores.
            </p>
          ) : (
            list.map((c) => (
              <div
                key={c.user_id}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary">
                  {(c.full_name ?? c.email ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.full_name ?? c.email}</p>
                  {c.full_name && (
                    <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                  )}
                </div>
                <Select value={c.role} onValueChange={(v) => changeRole(c.user_id, v as Role)}>
                  <SelectTrigger className="h-8 w-[96px] text-xs">
                    <SelectValue>
                      <Badge variant="secondary" className="font-normal">{ROLE_LABEL[c.role]}</Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Leitor</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => remove(c.user_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}