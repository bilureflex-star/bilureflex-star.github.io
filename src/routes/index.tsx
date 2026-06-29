import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Gavel,
  Landmark,
  Briefcase,
  ListChecks,
  Quote,
  Search,
  Settings2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-editor.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocMaster AI — Documentos perfeitos, formatação automática" },
      {
        name: "description",
        content:
          "Crie, formate e valide TCCs, petições, ofícios e mais com IA. Você escreve, o DocMaster AI cuida da estrutura, normas ABNT/APA e referências.",
      },
      { property: "og:title", content: "DocMaster AI" },
      {
        property: "og:description",
        content: "Automatize a criação e formatação de documentos acadêmicos, jurídicos e administrativos com IA.",
      },
    ],
  }),
  component: Landing,
});

const modules = [
  {
    icon: BookOpen,
    title: "Acadêmico",
    items: ["TCC", "Monografia", "Dissertação", "Artigo científico"],
    desc: "Estrutura automática com capa, resumo, desenvolvimento e referências nas normas ABNT, APA, MLA, Vancouver e Chicago.",
  },
  {
    icon: Gavel,
    title: "Jurídico",
    items: ["Petições e recursos", "Mandado de Segurança", "Agravo e embargos", "Acórdãos e pareceres"],
    desc: "Peças e decisões para tribunais com validação automática de endereçamento, tempestividade, fundamentação e pedidos.",
  },
  {
    icon: Landmark,
    title: "Administrativo",
    items: ["Portarias e decretos", "Editais e resoluções", "Requerimentos", "Notas técnicas"],
    desc: "Atos e comunicações de órgãos públicos com preâmbulo, fundamento legal, considerandos e cláusula de vigência validados.",
  },
  {
    icon: Briefcase,
    title: "Corporativo",
    items: ["Contratos", "Propostas comerciais", "Relatórios", "Atas e planos"],
    desc: "Contratos, propostas, relatórios gerenciais, atas de reunião e planos de negócios com estrutura profissional pronta para enviar.",
  },
];

const aiFeatures = [
  { icon: Sparkles, title: "Geração", desc: "Introdução, fundamentação, metodologia e conclusão escritas por IA." },
  { icon: Wand2, title: "Revisão", desc: "Gramática, coerência e clareza aprimoradas em um clique." },
  { icon: Search, title: "Pesquisa", desc: "Sugestão bibliográfica e busca de artigos por tema." },
  { icon: Quote, title: "Citações", desc: "Geração e conversão entre ABNT, APA e MLA automaticamente." },
];

const steps = [
  { n: "01", title: "Escolha o tipo", desc: "Selecione TCC, petição, ofício e a norma. A estrutura é montada na hora." },
  { n: "02", title: "Escreva ou gere", desc: "Você escreve o conteúdo — ou deixa a IA gerar e revisar cada seção." },
  { n: "03", title: "Exporte pronto", desc: "Baixe em PDF formatado e em conformidade com a norma escolhida." },
];

const plans = [
  { name: "Free", price: "R$0", tag: "Para experimentar", features: ["3 documentos", "Estrutura ABNT", "Exportação limitada"], cta: "Começar grátis", highlight: false },
  { name: "Student", price: "R$19", tag: "/mês", features: ["Documentos ilimitados", "TCC, artigos e monografias", "IA de geração e revisão", "Exportação PDF & DOCX"], cta: "Assinar Student", highlight: true },
  { name: "Pro", price: "R$49", tag: "/mês", features: ["Tudo do Student", "Módulo jurídico", "Módulo administrativo", "Suporte prioritário"], cta: "Assinar Pro", highlight: false },
  { name: "Enterprise", price: "Sob consulta", tag: "", features: ["White label & API", "Multi-tenancy", "Normas corporativas", "Integrações"], cta: "Falar com vendas", highlight: false },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <FileText className="h-5 w-5 text-primary" />
            DocMaster <span className="text-primary">AI</span>
          </div>
          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#modulos" className="transition-colors hover:text-foreground">Módulos</a>
            <a href="#ia" className="transition-colors hover:text-foreground">IA</a>
            <a href="#normas" className="transition-colors hover:text-foreground">Normas</a>
            <a href="#planos" className="transition-colors hover:text-foreground">Planos</a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Entrar</Link></Button>
            <Button asChild size="sm"><Link to="/auth">Começar grátis</Link></Button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero pt-32 pb-20 text-hero-foreground">
        <div className="absolute inset-0 grid-texture opacity-50" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Conformidade documental com IA
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
              Você escreve.<br />
              <span className="text-gradient">Nós formatamos.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-hero-muted">
              Pare de perder horas com regras de formatação. O DocMaster AI cria estrutura, normas, citações e referências de TCCs, petições e documentos oficiais automaticamente.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-glow">
                <Link to="/auth">Criar meu documento <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-hero-muted/30 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">
                <a href="#modulos">Ver módulos</a>
              </Button>
            </div>
            <p className="mt-5 text-sm text-hero-muted">ABNT · APA · MLA · Vancouver · Chicago</p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-3xl" />
            <img
              src={heroImage}
              alt="Editor inteligente de documentos do DocMaster AI"
              width={1280}
              height={960}
              className="relative w-full rounded-2xl border border-hero-muted/20 shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">O problema não é o conteúdo. É a formatação.</h2>
            <p className="mt-4 text-muted-foreground">
              Milhões de pessoas gastam mais tempo ajustando margens, citações e sumários do que produzindo conhecimento. Cada norma tem suas regras — e elas mudam.
            </p>
          </div>
          <div className="grid gap-4">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                <span className="font-display text-2xl font-bold text-primary">{s.n}</span>
                <div>
                  <h3 className="font-display font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modulos" className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Um motor para cada tipo de documento</h2>
            <p className="mt-3 text-muted-foreground">Acadêmico, jurídico, administrativo e corporativo — cada módulo conhece a estrutura e as regras certas.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m) => (
              <div key={m.title} className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-elegant">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <m.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">{m.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
                <ul className="mt-4 space-y-2">
                  {m.items.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI ENGINE */}
      <section id="ia" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Motor de IA
          </span>
          <h2 className="mt-4 text-3xl font-bold">Escreve, revisa e pesquisa com você</h2>
          <p className="mt-3 text-muted-foreground">A IA atua em cada seção do documento, sempre respeitando a norma escolhida.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {aiFeatures.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-display font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NORM ENGINE */}
      <section id="normas" className="bg-gradient-hero py-20 text-hero-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Settings2 className="h-3.5 w-3.5" /> Motor de Normas Dinâmicas
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold">Sua instituição cria as próprias regras</h2>
            <p className="mt-4 max-w-md text-hero-muted">
              Universidades, tribunais e órgãos públicos publicam suas normas em um criador visual. O documento é validado e corrigido automaticamente.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Settings2, t: "Criador visual" },
              { icon: ListChecks, t: "Validação automática" },
              { icon: Wand2, t: "Correção automática" },
              { icon: BookOpen, t: "Marketplace de normas" },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-hero-muted/20 bg-hero-foreground/5 p-5">
                <x.icon className="h-6 w-6 text-primary" />
                <p className="mt-3 font-medium">{x.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Planos para cada jornada</h2>
          <p className="mt-3 text-muted-foreground">Do estudante ao órgão público enterprise.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                "flex flex-col rounded-2xl border p-6 " +
                (p.highlight ? "border-primary bg-card shadow-elegant ring-1 ring-primary/30" : "border-border bg-card")
              }
            >
              {p.highlight && <span className="mb-3 inline-block w-fit rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">Mais popular</span>}
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              <p className="mt-2"><span className="font-display text-3xl font-bold">{p.price}</span><span className="text-sm text-muted-foreground">{p.tag}</span></p>
              <ul className="mt-5 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}</li>
                ))}
              </ul>
              <Button asChild variant={p.highlight ? "default" : "outline"} className="mt-6"><Link to="/auth">{p.cta}</Link></Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero px-8 py-16 text-center text-hero-foreground">
          <div className="absolute inset-0 grid-texture opacity-40" />
          <h2 className="relative font-display text-3xl font-bold sm:text-4xl">Pronto para parar de formatar?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-hero-muted">Crie seu primeiro documento gratuitamente e deixe a IA cuidar do resto.</p>
          <Button asChild size="lg" className="relative mt-8 shadow-glow"><Link to="/auth">Começar agora <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 font-display font-bold">
            <FileText className="h-5 w-5 text-primary" /> DocMaster <span className="text-primary">AI</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} DocMaster AI · Conformidade documental para a América Latina</p>
        </div>
      </footer>
    </div>
  );
}
