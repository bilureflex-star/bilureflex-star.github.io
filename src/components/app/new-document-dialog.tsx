import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOC_TYPES, NORMS, MODULES, getDocType, buildSections, type ModuleKey } from "@/lib/doc-templates";
import type { Json } from "@/integrations/supabase/types";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function NewDocumentDialog({ trigger }: { trigger?: React.ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState("tcc");
  const [norm, setNorm] = useState("ABNT");

  const docType = getDocType(typeId);

  async function create() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Sessão expirada. Entre novamente.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: userData.user.id,
        title: title.trim() || `Novo ${docType?.label ?? "Documento"}`,
        module: (docType?.module ?? "academic") as ModuleKey,
        doc_type: typeId,
        norm,
        sections: buildSections(typeId) as unknown as Json,
      })
      .select("id")
      .single();
    setLoading(false);
    if (error || !data) {
      toast.error("Não foi possível criar o documento.");
      return;
    }
    setOpen(false);
    navigate({ to: "/editor/$id", params: { id: data.id } });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo documento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo documento</DialogTitle>
          <DialogDescription>Escolha o tipo e a norma. A estrutura é montada automaticamente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Impactos da IA na educação" maxLength={160} />
          </div>
          <div className="space-y-2">
            <Label>Tipo de documento</Label>
            <Select value={typeId} onValueChange={(v) => { setTypeId(v); setNorm(getDocType(v)?.defaultNorm ?? "ABNT"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(MODULES) as ModuleKey[]).map((m) => (
                  <div key={m}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{MODULES[m].label}</div>
                    {DOC_TYPES.filter((d) => d.module === m).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {docType && <p className="text-xs text-muted-foreground">{docType.description}</p>}
          </div>
          <div className="space-y-2">
            <Label>Norma</Label>
            <Select value={norm} onValueChange={setNorm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {NORMS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={create} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar e abrir editor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}