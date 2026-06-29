import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app/app-header";
import { NewDocumentDialog } from "@/components/app/new-document-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { FileText, Trash2, FilePlus2, Users } from "lucide-react";
import { MODULE_LABEL, STATUS_LABEL, getDocType } from "@/lib/doc-templates";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

interface DocRow {
  id: string;
  title: string;
  module: string;
  doc_type: string;
  norm: string;
  status: string;
  updated_at: string;
  user_id: string;
}

function Dashboard() {
  const [docs, setDocs] = useState<DocRow[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | undefined>();
  const [uid, setUid] = useState<string | null>(null);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    setEmail(u.user?.email ?? null);
    setUid(u.user?.id ?? null);
    const [{ data: rows }, { data: profile }] = await Promise.all([
      supabase.from("documents").select("id,title,module,doc_type,norm,status,updated_at,user_id").order("updated_at", { ascending: false }),
      supabase.from("profiles").select("ai_credits").maybeSingle(),
    ]);
    setDocs((rows as DocRow[]) ?? []);
    setCredits(profile?.ai_credits);
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    setDocs((d) => d?.filter((x) => x.id !== id) ?? null);
    toast.success("Documento excluído.");
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <AppHeader email={email} credits={credits} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Meus documentos</h1>
            <p className="mt-1 text-muted-foreground">Crie, edite e exporte seus documentos com IA.</p>
          </div>
          <NewDocumentDialog />
        </div>

        <div className="mt-8">
          {docs === null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : docs.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-4 border-dashed py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <FilePlus2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold">Nenhum documento ainda</p>
                <p className="text-sm text-muted-foreground">Comece criando seu primeiro documento.</p>
              </div>
              <NewDocumentDialog />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((doc) => (
                <Card key={doc.id} className="group relative flex flex-col gap-3 p-5 transition-shadow hover:shadow-elegant">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {uid && doc.user_id !== uid && (
                        <Badge variant="outline" className="gap-1 font-normal">
                          <Users className="h-3 w-3" /> Compartilhado
                        </Badge>
                      )}
                      <Badge variant="secondary">{STATUS_LABEL[doc.status] ?? doc.status}</Badge>
                    </div>
                  </div>
                  <Link to="/editor/$id" params={{ id: doc.id }} className="block">
                    <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug">{doc.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getDocType(doc.doc_type)?.label ?? doc.doc_type} · {MODULE_LABEL[doc.module as keyof typeof MODULE_LABEL]} · {doc.norm}
                    </p>
                  </Link>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.updated_at).toLocaleDateString("pt-BR")}
                    </span>
                    {uid && doc.user_id === uid && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(doc.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}