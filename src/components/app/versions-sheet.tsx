import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import { History, Loader2, RotateCcw, Save, Trash2 } from "lucide-react";
import type { Section } from "@/lib/doc-templates";
import type { Json } from "@/integrations/supabase/types";

interface Version {
  id: string;
  label: string | null;
  title: string;
  sections: Section[];
  created_at: string;
}

interface Props {
  documentId: string;
  canEdit: boolean;
  isOwner: boolean;
  current: { title: string; sections: Section[] };
  onRestore: (snapshot: { title: string; sections: Section[] }) => void;
}

export function VersionsSheet({ documentId, canEdit, isOwner, current, onRestore }: Props) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Version[] | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("document_versions")
      .select("id,label,title,sections,created_at")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar versões.");
      setList([]);
      return;
    }
    setList(
      (data ?? []).map((v) => ({
        id: v.id,
        label: v.label,
        title: v.title,
        sections: (v.sections as unknown as Section[]) ?? [],
        created_at: v.created_at,
      })),
    );
  }

  function onOpenChange(v: boolean) {
    setOpen(v);
    if (v) {
      setList(null);
      load();
    }
  }

  async function saveVersion() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const words = current.sections.reduce(
      (n, s) => n + (s.content.trim() ? s.content.trim().split(/\s+/).length : 0),
      0,
    );
    const { error } = await supabase.from("document_versions").insert({
      document_id: documentId,
      created_by: u.user?.id ?? null,
      label: `${words} palavras`,
      title: current.title,
      sections: current.sections as unknown as Json,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar versão.");
      return;
    }
    toast.success("Versão salva no histórico.");
    load();
  }

  async function removeVersion(id: string) {
    setList((l) => l?.filter((v) => v.id !== id) ?? null);
    const { error } = await supabase.from("document_versions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir versão.");
      load();
    }
  }

  function restore(v: Version) {
    onRestore({ title: v.title, sections: v.sections });
    setOpen(false);
    toast.success("Versão restaurada.");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-1 h-4 w-4" /> Histórico
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <History className="h-5 w-5 text-primary" /> Histórico de versões
          </SheetTitle>
          <SheetDescription>
            Salve marcos do documento e restaure versões anteriores quando precisar.
          </SheetDescription>
        </SheetHeader>

        {canEdit && (
          <Button onClick={saveVersion} disabled={saving} className="mt-2">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Salvar versão atual
          </Button>
        )}

        <div className="mt-2 flex-1 space-y-3 overflow-y-auto pr-1">
          {list === null ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : list.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Nenhuma versão salva ainda.
            </p>
          ) : (
            list.map((v) => (
              <div key={v.id} className="rounded-xl border border-border p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{v.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleString("pt-BR")}
                      {v.label ? ` · ${v.label}` : ""}
                    </p>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground"
                      onClick={() => removeVersion(v.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.sections.length} seções
                </p>
                {canEdit && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restaurar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restaurar esta versão?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O conteúdo atual do documento será substituído por esta versão. Salve uma
                          versão antes, se quiser preservar o estado atual.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => restore(v)}>Restaurar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}