export type ModuleKey = "academic" | "legal" | "administrative" | "corporate";

export interface DocType {
  id: string;
  label: string;
  module: ModuleKey;
  description: string;
  sections: string[];
  defaultNorm: string;
}

export const NORMS = ["ABNT", "APA", "MLA", "Vancouver", "Chicago"] as const;

export const MODULES: Record<ModuleKey, { label: string; description: string }> = {
  academic: { label: "Acadêmico", description: "TCC, monografias, artigos e teses" },
  legal: { label: "Jurídico", description: "Petições, sentenças e acórdãos" },
  administrative: { label: "Administrativo", description: "Ofícios, memorandos e pareceres" },
  corporate: { label: "Corporativo", description: "Contratos, propostas, relatórios e atas" },
};

export const DOC_TYPES: DocType[] = [
  {
    id: "tcc",
    label: "TCC",
    module: "academic",
    description: "Trabalho de Conclusão de Curso completo com estrutura ABNT.",
    defaultNorm: "ABNT",
    sections: ["Capa", "Folha de Rosto", "Resumo", "Introdução", "Desenvolvimento", "Conclusão", "Referências"],
  },
  {
    id: "monografia",
    label: "Monografia",
    module: "academic",
    description: "Pesquisa monográfica aprofundada sobre um tema.",
    defaultNorm: "ABNT",
    sections: ["Capa", "Resumo", "Introdução", "Fundamentação Teórica", "Metodologia", "Conclusão", "Referências"],
  },
  {
    id: "artigo",
    label: "Artigo Científico",
    module: "academic",
    description: "Artigo para publicação em periódicos.",
    defaultNorm: "ABNT",
    sections: ["Título", "Resumo", "Abstract", "Introdução", "Metodologia", "Resultados", "Discussão", "Referências"],
  },
  {
    id: "dissertacao",
    label: "Dissertação",
    module: "academic",
    description: "Dissertação de mestrado.",
    defaultNorm: "ABNT",
    sections: ["Capa", "Resumo", "Introdução", "Revisão de Literatura", "Metodologia", "Resultados", "Conclusão", "Referências"],
  },
  {
    id: "peticao",
    label: "Petição Inicial",
    module: "legal",
    description: "Petição inicial com endereçamento e pedidos.",
    defaultNorm: "ABNT",
    sections: ["Endereçamento", "Qualificação das Partes", "Dos Fatos", "Do Direito", "Dos Pedidos", "Valor da Causa"],
  },
  {
    id: "sentenca",
    label: "Sentença",
    module: "legal",
    description: "Sentença judicial estruturada.",
    defaultNorm: "ABNT",
    sections: ["Relatório", "Fundamentação", "Dispositivo"],
  },
  {
    id: "habeas_corpus",
    label: "Habeas Corpus",
    module: "legal",
    description: "Impetração de Habeas Corpus.",
    defaultNorm: "ABNT",
    sections: ["Endereçamento", "Qualificação", "Dos Fatos", "Do Constrangimento Ilegal", "Do Direito", "Dos Pedidos"],
  },
  {
    id: "oficio",
    label: "Ofício",
    module: "administrative",
    description: "Comunicação oficial entre órgãos.",
    defaultNorm: "ABNT",
    sections: ["Cabeçalho", "Identificação", "Vocativo", "Corpo do Texto", "Fecho", "Assinatura"],
  },
  {
    id: "memorando",
    label: "Memorando",
    module: "administrative",
    description: "Comunicação interna objetiva.",
    defaultNorm: "ABNT",
    sections: ["Cabeçalho", "Assunto", "Corpo do Texto", "Fecho", "Assinatura"],
  },
  {
    id: "parecer",
    label: "Parecer",
    module: "administrative",
    description: "Parecer técnico ou jurídico fundamentado.",
    defaultNorm: "ABNT",
    sections: ["Ementa", "Relatório", "Fundamentação", "Conclusão"],
  },
  {
    id: "tese",
    label: "Tese",
    module: "academic",
    description: "Tese de doutorado com defesa de hipótese original.",
    defaultNorm: "ABNT",
    sections: ["Capa", "Resumo", "Abstract", "Introdução", "Revisão de Literatura", "Metodologia", "Resultados", "Discussão", "Conclusão", "Referências"],
  },
  {
    id: "projeto_pesquisa",
    label: "Projeto de Pesquisa",
    module: "academic",
    description: "Projeto submetido para aprovação de pesquisa.",
    defaultNorm: "ABNT",
    sections: ["Tema", "Problema", "Objetivos", "Justificativa", "Referencial Teórico", "Metodologia", "Cronograma", "Referências"],
  },
  {
    id: "resenha",
    label: "Resenha Crítica",
    module: "academic",
    description: "Análise crítica de obra ou artigo.",
    defaultNorm: "ABNT",
    sections: ["Referência da Obra", "Apresentação", "Resumo do Conteúdo", "Análise Crítica", "Conclusão"],
  },
  {
    id: "contestacao",
    label: "Contestação",
    module: "legal",
    description: "Defesa do réu em resposta à petição inicial.",
    defaultNorm: "ABNT",
    sections: ["Endereçamento", "Qualificação", "Preliminares", "Do Mérito", "Dos Pedidos"],
  },
  {
    id: "recurso",
    label: "Recurso de Apelação",
    module: "legal",
    description: "Recurso contra decisão de primeira instância.",
    defaultNorm: "ABNT",
    sections: ["Endereçamento", "Tempestividade", "Síntese dos Fatos", "Das Razões Recursais", "Dos Pedidos"],
  },
  {
    id: "procuracao",
    label: "Procuração",
    module: "legal",
    description: "Outorga de poderes a representante.",
    defaultNorm: "ABNT",
    sections: ["Outorgante", "Outorgado", "Dos Poderes", "Foro e Assinatura"],
  },
  {
    id: "contrato",
    label: "Contrato",
    module: "corporate",
    description: "Contrato de prestação de serviços ou fornecimento.",
    defaultNorm: "ABNT",
    sections: ["Das Partes", "Do Objeto", "Das Obrigações", "Do Valor e Pagamento", "Da Vigência", "Da Rescisão", "Do Foro"],
  },
  {
    id: "proposta_comercial",
    label: "Proposta Comercial",
    module: "corporate",
    description: "Proposta de venda ou prestação de serviço.",
    defaultNorm: "ABNT",
    sections: ["Apresentação", "Escopo", "Investimento", "Prazos", "Condições de Pagamento", "Validade"],
  },
  {
    id: "relatorio_corp",
    label: "Relatório Corporativo",
    module: "corporate",
    description: "Relatório gerencial ou de resultados.",
    defaultNorm: "ABNT",
    sections: ["Sumário Executivo", "Contexto", "Análise", "Resultados", "Recomendações", "Conclusão"],
  },
  {
    id: "ata_reuniao",
    label: "Ata de Reunião",
    module: "corporate",
    description: "Registro formal de reunião e deliberações.",
    defaultNorm: "ABNT",
    sections: ["Cabeçalho", "Participantes", "Pauta", "Deliberações", "Encaminhamentos", "Encerramento"],
  },
  {
    id: "plano_negocios",
    label: "Plano de Negócios",
    module: "corporate",
    description: "Plano estratégico para um negócio ou produto.",
    defaultNorm: "ABNT",
    sections: ["Sumário Executivo", "Descrição do Negócio", "Análise de Mercado", "Plano de Marketing", "Plano Operacional", "Plano Financeiro", "Conclusão"],
  },
  // ===== Fase 4: Jurídico avançado (tribunais) =====
  {
    id: "mandado_seguranca",
    label: "Mandado de Segurança",
    module: "legal",
    description: "Impetração de Mandado de Segurança contra ato de autoridade.",
    defaultNorm: "ABNT",
    sections: ["Endereçamento", "Qualificação do Impetrante", "Da Autoridade Coatora", "Dos Fatos", "Do Direito Líquido e Certo", "Do Pedido Liminar", "Dos Pedidos", "Valor da Causa"],
  },
  {
    id: "agravo_instrumento",
    label: "Agravo de Instrumento",
    module: "legal",
    description: "Recurso contra decisão interlocutória.",
    defaultNorm: "ABNT",
    sections: ["Endereçamento", "Tempestividade", "Da Decisão Agravada", "Das Razões do Agravo", "Do Efeito Suspensivo", "Dos Pedidos"],
  },
  {
    id: "embargos_declaracao",
    label: "Embargos de Declaração",
    module: "legal",
    description: "Embargos para sanar omissão, contradição ou obscuridade.",
    defaultNorm: "ABNT",
    sections: ["Endereçamento", "Tempestividade", "Da Decisão Embargada", "Da Omissão / Contradição / Obscuridade", "Dos Pedidos"],
  },
  {
    id: "contrarrazoes",
    label: "Contrarrazões de Recurso",
    module: "legal",
    description: "Resposta ao recurso interposto pela parte contrária.",
    defaultNorm: "ABNT",
    sections: ["Endereçamento", "Tempestividade", "Síntese do Recurso", "Das Contrarrazões", "Dos Pedidos"],
  },
  {
    id: "acordao",
    label: "Acórdão",
    module: "legal",
    description: "Decisão colegiada de tribunal.",
    defaultNorm: "ABNT",
    sections: ["Ementa", "Relatório", "Voto do Relator", "Fundamentação", "Dispositivo", "Decisão"],
  },
  {
    id: "parecer_juridico",
    label: "Parecer Jurídico",
    module: "legal",
    description: "Análise jurídica fundamentada para consulta ou processo.",
    defaultNorm: "ABNT",
    sections: ["Ementa", "Relatório", "Da Análise Jurídica", "Da Fundamentação Legal", "Conclusão"],
  },
  // ===== Fase 4: Administrativo avançado (órgãos públicos) =====
  {
    id: "portaria",
    label: "Portaria",
    module: "administrative",
    description: "Ato administrativo de autoridade pública.",
    defaultNorm: "ABNT",
    sections: ["Cabeçalho do Órgão", "Preâmbulo e Competência", "Considerandos", "Das Disposições (Resolve)", "Vigência", "Assinatura"],
  },
  {
    id: "decreto",
    label: "Decreto",
    module: "administrative",
    description: "Ato normativo do chefe do Poder Executivo.",
    defaultNorm: "ABNT",
    sections: ["Cabeçalho", "Preâmbulo e Fundamento Legal", "Considerandos", "Dos Artigos (Decreta)", "Disposições Finais", "Vigência", "Assinatura"],
  },
  {
    id: "edital",
    label: "Edital",
    module: "administrative",
    description: "Convocação pública (concurso, licitação, chamamento).",
    defaultNorm: "ABNT",
    sections: ["Cabeçalho do Órgão", "Do Objeto", "Das Condições de Participação", "Das Inscrições", "Do Cronograma", "Dos Critérios de Julgamento", "Das Disposições Finais"],
  },
  {
    id: "resolucao",
    label: "Resolução",
    module: "administrative",
    description: "Ato normativo de colegiado ou autoridade.",
    defaultNorm: "ABNT",
    sections: ["Cabeçalho", "Preâmbulo e Competência", "Considerandos", "Das Disposições (Resolve)", "Vigência", "Assinatura"],
  },
  {
    id: "requerimento",
    label: "Requerimento",
    module: "administrative",
    description: "Solicitação formal a órgão ou autoridade pública.",
    defaultNorm: "ABNT",
    sections: ["Endereçamento à Autoridade", "Qualificação do Requerente", "Do Requerimento", "Da Fundamentação", "Do Pedido", "Local, Data e Assinatura"],
  },
  {
    id: "despacho",
    label: "Despacho",
    module: "administrative",
    description: "Decisão ou encaminhamento em processo administrativo.",
    defaultNorm: "ABNT",
    sections: ["Identificação do Processo", "Do Relato", "Da Fundamentação", "Da Decisão / Encaminhamento", "Assinatura"],
  },
  {
    id: "nota_tecnica",
    label: "Nota Técnica",
    module: "administrative",
    description: "Manifestação técnica fundamentada de órgão público.",
    defaultNorm: "ABNT",
    sections: ["Identificação", "Do Objeto", "Da Análise Técnica", "Da Fundamentação", "Da Conclusão", "Recomendações"],
  },
];

export function getDocType(id: string): DocType | undefined {
  return DOC_TYPES.find((d) => d.id === id);
}

export interface Section {
  title: string;
  content: string;
}

export function buildSections(typeId: string): Section[] {
  const type = getDocType(typeId);
  const titles = type?.sections ?? ["Introdução", "Desenvolvimento", "Conclusão"];
  return titles.map((title) => ({ title, content: "" }));
}

export const MODULE_LABEL: Record<ModuleKey, string> = {
  academic: "Acadêmico",
  legal: "Jurídico",
  administrative: "Administrativo",
  corporate: "Corporativo",
};

export const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  completed: "Concluído",
};