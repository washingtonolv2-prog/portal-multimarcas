import { cookies } from "next/headers";

// Modo demonstração: dados fictícios só para apresentar o portal. Nada é lido nem gravado no banco.
export async function isDemo(): Promise<boolean> {
  return (await cookies()).get("demo")?.value === "1";
}

export async function demoAcked(): Promise<Set<string>> {
  const v = (await cookies()).get("demo_ack")?.value ?? "";
  return new Set(v.split(",").filter(Boolean));
}

const daysAgo = (n: number, h = 8) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(h + 3, 40, 0, 0);
  return d.toISOString();
};

export type DemoAnnouncement = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  requires_ack: boolean;
  featured: boolean;
  publish_at: string;
};

export function demoAnnouncements(): DemoAnnouncement[] {
  return [
    {
      id: "d0000000-0000-4000-8000-000000000001",
      title: "Campanha de fim de ano: regras de troca e vitrine",
      summary: "Novo manual de vitrine e política de troca válidos de 20/11 a 31/12.",
      body: "Equipes,\n\nA vitrine de todas as lojas multimarcas segue o novo manual de fim de ano. Os materiais já estão na pasta Vitrine e merchandising.\n\nTrocas: durante a campanha, o prazo para troca de presentes passa a ser de 30 dias, com a nota fiscal.\n\nConfirmem a leitura até sexta-feira.",
      category: "Campanha",
      requires_ack: true,
      featured: true,
      publish_at: daysAgo(0),
    },
    {
      id: "d0000000-0000-4000-8000-000000000002",
      title: "Treinamento de montagem de vitrine — turmas de dezembro",
      summary: "Inscrições abertas para as lojas do Rio de Janeiro e do Espírito Santo.",
      body: "As inscrições para as turmas de dezembro estão abertas. Cada loja pode indicar até duas pessoas.\n\nResponda ao seu supervisor até o dia 20.",
      category: "Treinamento",
      requires_ack: false,
      featured: true,
      publish_at: daysAgo(3),
    },
    {
      id: "d0000000-0000-4000-8000-000000000003",
      title: "Conferência de estoque: prazo do inventário",
      summary: "Saldo das lojas deve ser preenchido até o dia 28.",
      body: "O gerente de cada loja deve preencher o saldo no aplicativo de conferência até o dia 28. O supervisor aprova em seguida.",
      category: "Aviso",
      requires_ack: true,
      featured: true,
      publish_at: daysAgo(6),
    },
    {
      id: "d0000000-0000-4000-8000-000000000004",
      title: "Horário especial de funcionamento em dezembro",
      summary: "Lojas de shopping abrem mais cedo a partir do dia 1º.",
      body: "A partir de 1º de dezembro, as lojas de shopping seguem o horário estendido definido pelo shopping. Lojas de rua mantêm o horário atual.",
      category: "Aviso",
      requires_ack: false,
      featured: false,
      publish_at: daysAgo(9),
    },
    {
      id: "d0000000-0000-4000-8000-000000000005",
      title: "Novo fluxo de pedidos de reposição",
      summary: "Pedidos passam a ser feitos até as 15h para saírem no mesmo dia.",
      body: "Para agilizar a reposição, os pedidos feitos até as 15h saem no mesmo dia. Pedidos após esse horário saem no dia útil seguinte.",
      category: "Processo",
      requires_ack: false,
      featured: false,
      publish_at: daysAgo(14),
    },
  ];
}

export function demoEvents(today: string) {
  const [y, m] = today.split("-").map(Number);
  const d = (day: number) => `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const t = Number(today.slice(8));
  const at = (n: number) => d(Math.min(last, Math.max(1, t + n)));
  return [
    { id: "e1", title: "Reunião de gerentes", starts_on: at(2), kind: "evento" },
    { id: "e2", title: "Prazo do inventário", starts_on: at(5), kind: "prazo" },
    { id: "e3", title: "Treinamento de vitrine", starts_on: at(9), kind: "evento" },
    { id: "e4", title: "Feriado municipal", starts_on: at(12), kind: "feriado" },
  ].sort((a, b) => a.starts_on.localeCompare(b.starts_on));
}

export const DEMO_STORES = ["Tijuca", "Copa", "Center"];

export const DEMO_FOLDERS = [
  { id: "f0000000-0000-4000-8000-000000000001", name: "Vitrine e merchandising", description: "Manuais, fotos de referência e materiais de campanha" },
  { id: "f0000000-0000-4000-8000-000000000002", name: "Tabelas de preço", description: "Tabelas e listas de preço vigentes" },
  { id: "f0000000-0000-4000-8000-000000000003", name: "Treinamentos", description: "Apresentações e vídeos de treinamento" },
];

export function demoFiles(folderId: string) {
  const mod = (n: number) => daysAgo(n);
  const sets: Record<string, { name: string; size: number; n: number }[]> = {
    [DEMO_FOLDERS[0].id]: [
      { name: "Manual de vitrine — fim de ano.pdf", size: 4_400_000, n: 1 },
      { name: "Fotos de referência — vitrines aprovadas.pdf", size: 12_800_000, n: 2 },
      { name: "Layout de gôndola.xlsx", size: 180_000, n: 8 },
    ],
    [DEMO_FOLDERS[1].id]: [
      { name: "Tabela de preços — novembro.xlsx", size: 240_000, n: 4 },
      { name: "Promoções da semana.pdf", size: 900_000, n: 2 },
    ],
    [DEMO_FOLDERS[2].id]: [
      { name: "Atendimento e vendas.pptx", size: 6_100_000, n: 20 },
      { name: "Uso do aplicativo de conferência.pdf", size: 1_300_000, n: 11 },
    ],
  };
  return (sets[folderId] ?? []).map((f, i) => ({
    ".tag": "file" as const,
    id: `demo-${folderId.slice(-2)}-${i}`,
    name: f.name,
    size: f.size,
    server_modified: mod(f.n),
  }));
}
