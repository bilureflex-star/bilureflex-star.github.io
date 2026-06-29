import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { runAiWriter } from "@/lib/ai.functions";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Cloud,
  Download,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { NORMS, STATUS_LABEL, getDocType, type Section } from "@/lib/doc-templates";
import type { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { ShareDialog } from "@/components/app/share-dialog";
import { VersionsSheet } from "@/components/app/versions-sheet";
import { ValidationSheet } from "@/components/app/validation-sheet";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/editor/$id")({
  component: Editor,
});

interface DocState {
  title: string;
  doc_type: string;
  norm: string;
  status: string;
  sections: Section[];
}

type Access = "owner" | "editor" | "viewer";

function Editor() {
  const { id } = useParams({ from: "/_authenticated/editor/$id" });
  const navigate = useNavigate();
  const aiWriter = useServerFn(runAiWriter);

  const [doc, setDoc] = useState<DocState | null>(null);
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [access, setAccess] = useState<Access>("viewer");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setEmail(u.user?.email ?? null);
      const { data, error } = await supabase
        .from("documents")
        .select("title,doc_type,norm,status,sections,user_id")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Documento não encontrado.");
        navigate({ to: "/dashboard" });
        return;
      }
      if (u.user && data.user_id === u.user.id) {
        setAccess("owner");
      } else {
        const { data: collab } = await supabase
          .from("document_collaborators")
          .select("role")
          .eq("document_id", id)
          .eq("user_id", u.user?.id ?? "")
          .maybeSingle();
        setAccess(collab?.role === "editor" ? "editor" : "viewer");
      }
      setDoc({
        title: data.title,
        doc_type: data.doc_type,
        norm: data.norm,
        status: data.status,
        sections: (data.sections as unknown as Section[]) ?? [],
      });
    })();
  }, [id, navigate]);

  const persist = useCallback(
    (next: DocState) => {
      setSaving("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const { error } = await supabase
          .from("documents")
          .update({
            title: next.title,
            norm: next.norm,
            status: next.status as "draft" | "review" | "completed",
            sections: next.sections as unknown as Json,
          })
          .eq("id", id);
        setSaving(error ? "idle" : "saved");
        if (error) toast.error("Falha ao salvar.");
      }, 800);
    },
    [id],
  );

  function update(patch: Partial<DocState>) {
    setDoc((d) => {
      if (!d) return d;
      const next = { ...d, ...patch };
      persist(next);
      return next;
    });
  }

  function updateSection(index: number, patch: Partial<Section>) {
    setDoc((d) => {
      if (!d) return d;
      const sections = d.sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
      const next = { ...d, sections };
      persist(next);
      return next;
    });
  }

  function addSection() {
    setDoc((d) => {
      if (!d) return d;
      const sections = [...d.sections, { title: "Nova seção", content: "" }];
      const next = { ...d, sections };
      persist(next);
      setActive(sections.length - 1);
      return next;
    });
  }

  function removeSection(index: number) {
    setDoc((d) => {
      if (!d || d.sections.length <= 1) return d;
      const sections = d.sections.filter((_, i) => i !== index);
      const next = { ...d, sections };
      persist(next);
      setActive((a) => Math.max(0, Math.min(a, sections.length - 1)));
      return next;
    });
  }

  async function runAi(mode: "generate" | "improve" | "references") {
    if (!doc) return;
    const section = doc.sections[active];
    if (mode === "improve" && !section.content.trim()) {
      toast.error("Escreva algo antes de revisar.");
      return;
    }
    setAiBusy(mode);
    try {
      const { content } = await aiWriter({
        data: {
          mode,
          docType: getDocType(doc.doc_type)?.label ?? doc.doc_type,
          norm: doc.norm,
          sectionTitle: section.title,
          topic: doc.title,
          text: section.content,
        },
      });
      if (!content) { toast.error("A IA não retornou conteúdo."); return; }
      const newContent =
        mode === "improve" || mode === "generate"
          ? content
          : (section.content ? section.content + "\n\n" : "") + content;
      updateSection(active, { content: newContent });
      // best-effort credit decrement
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase
          .from("profiles")
          .update({ ai_credits: Math.max(0, (await getCredits()) - 1) })
          .eq("id", u.user.id);
      }
      toast.success(mode === "improve" ? "Texto revisado." : mode === "references" ? "Referências geradas." : "Conteúdo gerado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na IA.");
    } finally {
      setAiBusy(null);
    }
  }

  async function getCredits(): Promise<number> {
    const { data } = await supabase.from("profiles").select("ai_credits").maybeSingle();
    return data?.ai_credits ?? 0;
  }

  function restoreVersion(snapshot: { title: string; sections: Section[] }) {
    setDoc((d) => {
      if (!d) return d;
      const next = { ...d, title: snapshot.title, sections: snapshot.sections };
      persist(next);
      return next;
    });
    setActive(0);
  }

  function exportHtml() {
    if (!doc) return;
    const body = doc.sections
      .map((s) => `<h2>${escapeHtml(s.title)}</h2>${s.content
        .split(/\n+/)
        .filter(Boolean)
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join("")}`)
      .join("");
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(doc.title)}</title>
<style>body{font-family:'Times New Roman',serif;max-width:760px;margin:40px auto;line-height:1.6;color:#111;padding:0 24px}h1{text-align:center}h2{margin-top:28px}p{text-align:justify;text-indent:1.25cm}@media print{body{margin:0}}</style>
</head><body><h1>${escapeHtml(doc.title)}</h1>${body}</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permita pop-ups para exportar."); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader email={email} />
        <div className="mx-auto max-w-5xl space-y-4 px-6 py-10">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const section = doc.sections[active];
  const isRefs = /refer[êe]nc/i.test(section?.title ?? "");
  const words = section?.content.trim() ? section.content.trim().split(/\s+/).length : 0;
  const canEdit = access !== "viewer";

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <AppHeader email={email} />
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
          <Input
            value={doc.title}
            onChange={(e) => update({ title: e.target.value })}
            className="h-9 max-w-md border-transparent bg-transparent font-display text-base font-semibold focus-visible:border-input"
            maxLength={160}
            readOnly={!canEdit}
          />
          {!canEdit && (
            <Badge variant="secondary" className="gap-1 font-normal">
              <Eye className="h-3.5 w-3.5" /> Somente leitura
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {saving === "saving" ? (
                <><Cloud className="h-3.5 w-3.5 animate-pulse" /> Salvando…</>
              ) : saving === "saved" ? (
                <><Check className="h-3.5 w-3.5 text-primary" /> Salvo</>
              ) : null}
            </span>
            <Select value={doc.norm} onValueChange={(v) => update({ norm: v })} disabled={!canEdit}>
              <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>{NORMS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={doc.status} onValueChange={(v) => update({ status: v })} disabled={!canEdit}>
              <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <VersionsSheet
              documentId={id}
              canEdit={canEdit}
              isOwner={access === "owner"}
              current={{ title: doc.title, sections: doc.sections }}
              onRestore={restoreVersion}
            />
            <ValidationSheet doc={{ title: doc.title, doc_type: doc.doc_type, norm: doc.norm, sections: doc.sections }} />
            {access === "owner" && <ShareDialog documentId={id} />}
            <Button size="sm" onClick={exportHtml}><Download className="mr-1 h-4 w-4" /> Exportar PDF</Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-1">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estrutura</p>
          {doc.sections.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                i === active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] text-secondary-foreground">{i + 1}</span>
              <span className="line-clamp-1">{s.title}</span>
            </button>
          ))}
          {canEdit && (
            <Button variant="ghost" size="sm" className="mt-1 w-full justify-start text-muted-foreground" onClick={addSection}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar seção
            </Button>
          )}
        </aside>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Input
              value={section.title}
              onChange={(e) => updateSection(active, { title: e.target.value })}
              className="h-10 border-transparent bg-transparent font-display text-xl font-semibold focus-visible:border-input"
              readOnly={!canEdit}
            />
            {canEdit && doc.sections.length > 1 && (
              <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => removeSection(active)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {canEdit && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={!!aiBusy} onClick={() => runAi("generate")}>
              {aiBusy === "generate" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
              Gerar com IA
            </Button>
            <Button variant="outline" size="sm" disabled={!!aiBusy} onClick={() => runAi("improve")}>
              {aiBusy === "improve" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1 h-4 w-4" />}
              Revisar texto
            </Button>
            {isRefs && (
              <Button variant="outline" size="sm" disabled={!!aiBusy} onClick={() => runAi("references")}>
                {aiBusy === "references" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                Sugerir referências
              </Button>
            )}
          </div>
          )}

          <Textarea
            value={section.content}
            onChange={(e) => updateSection(active, { content: e.target.value })}
            placeholder="Escreva o conteúdo desta seção ou gere com a IA…"
            className="mt-4 min-h-[420px] resize-y border-border text-base leading-relaxed"
            readOnly={!canEdit}
          />
          <p className="mt-2 text-right text-xs text-muted-foreground">{words} palavras</p>
        </section>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}