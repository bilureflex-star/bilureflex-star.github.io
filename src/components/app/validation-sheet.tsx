import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { validateDocument } from "@/lib/doc-validation";
import type { Section } from "@/lib/doc-templates";

interface Props {
  doc: { title: string; doc_type: string; norm: string; sections: Section[] };
  onJumpToSection?: (sectionTitle: string) => void;
}

const STATUS_META = {
  ok: { Icon: CheckCircle2, color: "text-primary", label: "Conforme" },
  warning: { Icon: AlertTriangle, color: "text-amber-500", label: "Atenção" },
  error: { Icon: XCircle, color: "text-destructive", label: "Pendência" },
} as const;

export function ValidationSheet({ doc }: Props) {
  const [open, setOpen] = useState(false);
  const report = useMemo(() => validateDocument(doc), [doc, open]);

  const tone =
    report.errors > 0 ? "text-destructive" : report.warnings > 0 ? "text-amber-500" : "text-primary";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldCheck className="mr-1 h-4 w-4" /> Validar
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Validação de conformidade
          </SheetTitle>
          <SheetDescription>
            Motor de normas: verifica a estrutura e os elementos obrigatórios deste tipo de documento.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Conformidade</p>
              <p className={cn("font-display text-4xl font-bold", tone)}>{report.score}%</p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              <Badge variant="secondary" className="gap-1 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" /> {report.passed}
              </Badge>
              {report.warnings > 0 && (
                <Badge variant="secondary" className="gap-1 text-amber-500">
                  <AlertTriangle className="h-3.5 w-3.5" /> {report.warnings}
                </Badge>
              )}
              {report.errors > 0 && (
                <Badge variant="secondary" className="gap-1 text-destructive">
                  <XCircle className="h-3.5 w-3.5" /> {report.errors}
                </Badge>
              )}
            </div>
          </div>
          <Progress value={report.score} className="mt-3 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {report.errors === 0 && report.warnings === 0
              ? "Documento em conformidade com as regras verificadas."
              : `${report.errors} pendência(s) e ${report.warnings} ponto(s) de atenção.`}
          </p>
        </div>

        <ul className="mt-4 space-y-2 pb-6">
          {report.results.map((r) => {
            const meta = STATUS_META[r.status];
            return (
              <li
                key={r.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3"
              >
                <meta.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.color)} />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{r.label}</p>
                  {r.detail && <p className="mt-0.5 text-xs text-muted-foreground">{r.detail}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
