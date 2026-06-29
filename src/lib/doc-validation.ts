import { getDocType, type Section } from "./doc-templates";

export type CheckStatus = "ok" | "warning" | "error";

export interface CheckResult {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}

export interface ValidationReport {
  score: number;
  passed: number;
  total: number;
  errors: number;
  warnings: number;
  results: CheckResult[];
}

interface TypeRule {
  id: string;
  label: string;
  severity: "error" | "warning";
  /** Match a section by case-insensitive substring of its title. */
  section?: string;
  /** At least one of these terms must appear (in the section, or whole doc if no section). */
  keywords?: string[];
  /** Content must match this pattern. */
  pattern?: RegExp;
  /** Minimum word count for the matched section. */
  minWords?: number;
}

/** Type-specific rules — the "Motor de Normas". */
const RULES: Record<string, TypeRule[]> = {
  peticao: [
    { id: "end", label: "Endereçamento ao juízo competente", severity: "error", section: "Endereçamento", keywords: ["excelent", "meritíssimo", "juiz", "vara", "comarca", "tribunal", "foro"] },
    { id: "valor", label: "Valor da causa expresso em reais", severity: "error", section: "Valor da Causa", pattern: /r\$\s?\d|\d+[.,]\d{2}|reais/i },
    { id: "pedidos", label: "Pedidos claramente formulados", severity: "error", section: "Dos Pedidos", minWords: 15 },
  ],
  mandado_seguranca: [
    { id: "end", label: "Endereçamento ao juízo/tribunal competente", severity: "error", section: "Endereçamento", keywords: ["excelent", "tribunal", "juiz", "vara", "desembargador"] },
    { id: "autoridade", label: "Autoridade coatora identificada", severity: "error", section: "Autoridade Coatora", minWords: 8 },
    { id: "liquido", label: "Direito líquido e certo demonstrado", severity: "error", section: "Direito Líquido", minWords: 25 },
    { id: "liminar", label: "Pedido liminar fundamentado", severity: "warning", section: "Liminar", keywords: ["fumus", "periculum", "urgênc", "liminar", "perigo"] },
    { id: "valor", label: "Valor da causa informado", severity: "warning", section: "Valor da Causa", pattern: /r\$\s?\d|\d+[.,]\d{2}|reais/i },
  ],
  agravo_instrumento: [
    { id: "tempest", label: "Tempestividade demonstrada", severity: "error", section: "Tempestividade", keywords: ["prazo", "tempest", "dias", "intim", "publicaç"] },
    { id: "decisao", label: "Decisão agravada identificada", severity: "error", section: "Decisão Agravada", minWords: 12 },
    { id: "suspensivo", label: "Pedido de efeito suspensivo", severity: "warning", section: "Efeito Suspensivo", minWords: 10 },
  ],
  embargos_declaracao: [
    { id: "tempest", label: "Tempestividade demonstrada", severity: "error", section: "Tempestividade", keywords: ["prazo", "tempest", "dias", "intim"] },
    { id: "vicio", label: "Vício apontado (omissão, contradição ou obscuridade)", severity: "error", section: "Omissão", keywords: ["omiss", "contradi", "obscur", "erro material"] },
  ],
  contrarrazoes: [
    { id: "tempest", label: "Tempestividade demonstrada", severity: "error", section: "Tempestividade", keywords: ["prazo", "tempest", "dias", "intim"] },
    { id: "merito", label: "Contrarrazões com argumentação de mérito", severity: "error", section: "Contrarrazões", minWords: 25 },
  ],
  recurso: [
    { id: "tempest", label: "Tempestividade demonstrada", severity: "error", section: "Tempestividade", keywords: ["prazo", "tempest", "dias", "intim"] },
    { id: "razoes", label: "Razões recursais fundamentadas", severity: "error", section: "Razões Recursais", minWords: 25 },
  ],
  acordao: [
    { id: "ementa", label: "Ementa presente e concisa", severity: "error", section: "Ementa", minWords: 8 },
    { id: "relatorio", label: "Relatório descrevendo o caso", severity: "error", section: "Relatório", minWords: 20 },
    { id: "dispositivo", label: "Dispositivo com a decisão", severity: "error", section: "Dispositivo", minWords: 8 },
  ],
  sentenca: [
    { id: "relatorio", label: "Relatório presente", severity: "error", section: "Relatório", minWords: 15 },
    { id: "fundamentacao", label: "Fundamentação suficiente", severity: "error", section: "Fundamentação", minWords: 30 },
    { id: "dispositivo", label: "Dispositivo com a decisão", severity: "error", section: "Dispositivo", minWords: 8 },
  ],
  habeas_corpus: [
    { id: "end", label: "Endereçamento à autoridade competente", severity: "error", section: "Endereçamento", keywords: ["excelent", "tribunal", "juiz", "desembargador"] },
    { id: "constrangimento", label: "Constrangimento ilegal demonstrado", severity: "error", section: "Constrangimento", minWords: 20 },
  ],
  parecer_juridico: [
    { id: "ementa", label: "Ementa presente", severity: "warning", section: "Ementa", minWords: 6 },
    { id: "fundamento", label: "Fundamentação legal citada", severity: "error", section: "Fundamentação", keywords: ["art.", "artigo", "lei", "código", "súmula", "cf/88", "constituição"] },
    { id: "conclusao", label: "Conclusão objetiva", severity: "error", section: "Conclusão", minWords: 12 },
  ],
  // Administrativo / órgãos públicos
  portaria: [
    { id: "competencia", label: "Competência/fundamento legal indicado", severity: "error", section: "Competência", keywords: ["no uso", "atribuiç", "art.", "lei", "decreto", "competênc"] },
    { id: "considerandos", label: "Considerandos justificando o ato", severity: "warning", section: "Considerandos", keywords: ["considerando"] },
    { id: "resolve", label: "Disposições (Resolve) presentes", severity: "error", section: "Resolve", minWords: 10 },
    { id: "vigencia", label: "Cláusula de vigência", severity: "warning", section: "Vigência", keywords: ["vigor", "vigênc", "data de", "publicaç"] },
  ],
  decreto: [
    { id: "fundamento", label: "Fundamento legal no preâmbulo", severity: "error", section: "Fundamento Legal", keywords: ["no uso", "atribuiç", "art.", "lei", "constituição", "competênc"] },
    { id: "decreta", label: "Artigos (Decreta) presentes", severity: "error", section: "Decreta", minWords: 10 },
    { id: "vigencia", label: "Cláusula de vigência", severity: "warning", section: "Vigência", keywords: ["vigor", "vigênc", "publicaç"] },
  ],
  resolucao: [
    { id: "competencia", label: "Competência indicada no preâmbulo", severity: "error", section: "Competência", keywords: ["no uso", "atribuiç", "art.", "competênc", "regiment"] },
    { id: "resolve", label: "Disposições (Resolve) presentes", severity: "error", section: "Resolve", minWords: 10 },
  ],
  edital: [
    { id: "objeto", label: "Objeto do edital definido", severity: "error", section: "Objeto", minWords: 10 },
    { id: "inscricoes", label: "Regras de inscrição/participação", severity: "error", section: "Inscrições", minWords: 12 },
    { id: "cronograma", label: "Cronograma com datas", severity: "warning", section: "Cronograma", pattern: /\d{1,2}\/\d{1,2}|\d{1,2}\s+de\s+\w+|prazo|data/i },
    { id: "criterios", label: "Critérios de julgamento", severity: "warning", section: "Critérios", minWords: 10 },
  ],
  requerimento: [
    { id: "end", label: "Endereçamento à autoridade", severity: "error", section: "Autoridade", keywords: ["ilustr", "senhor", "exmo", "excelent", "diretor", "secret", "prefeito", "ministro"] },
    { id: "pedido", label: "Pedido claramente formulado", severity: "error", section: "Pedido", minWords: 8 },
    { id: "data", label: "Local, data e assinatura", severity: "warning", section: "Local, Data", minWords: 4 },
  ],
  despacho: [
    { id: "processo", label: "Processo identificado", severity: "error", section: "Processo", minWords: 3 },
    { id: "decisao", label: "Decisão ou encaminhamento", severity: "error", section: "Decisão", minWords: 8 },
  ],
  nota_tecnica: [
    { id: "objeto", label: "Objeto da nota definido", severity: "error", section: "Objeto", minWords: 8 },
    { id: "analise", label: "Análise técnica desenvolvida", severity: "error", section: "Análise Técnica", minWords: 25 },
    { id: "conclusao", label: "Conclusão objetiva", severity: "error", section: "Conclusão", minWords: 10 },
  ],
  oficio: [
    { id: "vocativo", label: "Vocativo presente", severity: "warning", section: "Vocativo", minWords: 1 },
    { id: "corpo", label: "Corpo do texto desenvolvido", severity: "error", section: "Corpo", minWords: 15 },
    { id: "fecho", label: "Fecho de cortesia", severity: "warning", section: "Fecho", keywords: ["atenciosamente", "respeitosamente", "cordialmente"] },
  ],
};

const MIN_WORDS_DEFAULT = 12;

function wordCount(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

function findSection(sections: Section[], match: string): Section | undefined {
  const m = match.toLowerCase();
  return sections.find((s) => s.title.toLowerCase().includes(m));
}

export function validateDocument(input: {
  title: string;
  doc_type: string;
  norm: string;
  sections: Section[];
}): ValidationReport {
  const { title, doc_type, norm, sections } = input;
  const results: CheckResult[] = [];

  // Universal: title
  results.push({
    id: "title",
    label: "Título do documento definido",
    status: title.trim().length >= 3 ? "ok" : "error",
    detail: title.trim().length >= 3 ? undefined : "Defina um título com pelo menos 3 caracteres.",
  });

  // Universal: every template section exists and is filled
  const type = getDocType(doc_type);
  const empty = sections.filter((s) => wordCount(s.content) === 0);
  results.push({
    id: "sections-filled",
    label: "Todas as seções preenchidas",
    status: empty.length === 0 ? "ok" : empty.length <= 2 ? "warning" : "error",
    detail: empty.length === 0 ? undefined : `Pendentes: ${empty.map((s) => s.title).join(", ")}.`,
  });

  // Universal: minimum body length
  const totalWords = sections.reduce((acc, s) => acc + wordCount(s.content), 0);
  results.push({
    id: "length",
    label: "Conteúdo com extensão mínima",
    status: totalWords >= 80 ? "ok" : totalWords >= 30 ? "warning" : "error",
    detail: `${totalWords} palavras no total.`,
  });

  // References check for academic / norm-bound docs
  if (type?.module === "academic") {
    const refs = findSection(sections, "refer");
    results.push({
      id: "references",
      label: `Referências conforme a norma ${norm}`,
      status: refs && wordCount(refs.content) >= 5 ? "ok" : "warning",
      detail: refs ? undefined : "Inclua uma seção de Referências.",
    });
  }

  // Type-specific rules
  for (const rule of RULES[doc_type] ?? []) {
    const target = rule.section ? findSection(sections, rule.section) : undefined;
    const haystack = (rule.section ? target?.content ?? "" : sections.map((s) => s.content).join("\n")).toLowerCase();
    let status: CheckStatus = "ok";
    let detail: string | undefined;

    if (rule.section && (!target || wordCount(target.content) === 0)) {
      status = rule.severity;
      detail = "Seção ausente ou vazia.";
    } else if (rule.minWords && wordCount(target?.content ?? haystack) < rule.minWords) {
      status = rule.severity;
      detail = `Desenvolva mais — mínimo de ${rule.minWords} palavras.`;
    } else if (rule.keywords && !rule.keywords.some((k) => haystack.includes(k.toLowerCase()))) {
      status = rule.severity;
      detail = "Elemento obrigatório não identificado no texto.";
    } else if (rule.pattern && !rule.pattern.test(target?.content ?? haystack)) {
      status = rule.severity;
      detail = "Formato esperado não encontrado.";
    }

    results.push({ id: rule.id, label: rule.label, status, detail });
  }

  const total = results.length;
  const passed = results.filter((r) => r.status === "ok").length;
  const errors = results.filter((r) => r.status === "error").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const score = Math.round(((passed + warnings * 0.5) / total) * 100);

  return { score, passed, total, errors, warnings, results };
}
