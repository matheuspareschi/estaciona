// Testes simples para o console. Não são carregados pelo app.
//   No navegador (com o app aberto por servidor local), no console:
//     (await import("./js/dev/testes.js")).rodar()
//   No terminal:  node -e "import('./js/dev/testes.js').then(m => m.rodar())"
// Usam um localStorage falso: não tocam nos seus dados reais.

import { normalizar, hoje, virarDia, deixar, fila, retomar, historicoPorData, trajetoria, ErroDeValidacao } from "../state.js";
import { sortear, PERGUNTAS } from "../prompts.js";
import { paraJSON, paraMarkdown } from "../export.js";
import { criarStorage, dadosVazios, CHAVE, CHAVE_BACKUP } from "../storage.js";

const casos = [];
const teste = (nome, fn) => casos.push({ nome, fn });
const igual = (a, b, msg = "") => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`);
};
const verdade = (v, msg) => {
  if (!v) throw new Error(msg);
};
const lanca = (fn, classe) => {
  try {
    fn();
  } catch (e) {
    if (!classe || e instanceof classe) return e;
    throw new Error(`lançou ${e.name}, esperado ${classe.name}`);
  }
  throw new Error("deveria ter lançado erro");
};

// relógio: dia (AAAA-MM-DD) + minuto, em horário local
const em = (dia, hora = 9, min = 0) => {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(a, m - 1, d, hora, min);
};
const deixarEm = (dados, dia, args, hora = 9, min = 0) => deixar(dados, args, dia, em(dia, hora, min));
const nomes = (lista) => lista.map((e) => e.nome);

// ---------- identidade ----------
teste("normalizar ignora acento, caixa e espaços nas pontas", () => {
  igual(normalizar("  Relatório DE Chamados "), "relatorio de chamados");
  igual(normalizar("Ação"), "acao");
});

teste("hoje() usa data local (não UTC)", () => {
  igual(hoje(new Date(2026, 10, 9, 23, 30)), "2026-11-09");
  igual(hoje(new Date(2026, 0, 5, 0, 5)), "2026-01-05");
});

// ---------- deixar ----------
teste("deixar cria entrada nova, nunca sobrescreve, e zera a ativa", () => {
  let d = { history: [], active: { nome: "A", proximoPasso: "x", data: "2026-11-10" } };
  d = deixarEm(d, "2026-11-10", { nome: "A", status: "aberta", linha: "passo 1" });
  d = deixarEm(d, "2026-11-10", { nome: "A", status: "aberta", linha: "passo 2" }, 10);
  igual(d.history.length, 2);
  igual(d.history[0].proximoPasso, "passo 1");
  igual(d.active, null);
  const e = d.history[1];
  igual(Object.keys(e).sort(), ["criadoEm", "data", "id", "nome", "nota", "proximoPasso", "status"]);
  verdade(e.id && e.id !== d.history[0].id, "ids devem ser únicos");
});

teste("validação: nome obrigatório; próximo passo obrigatório só em Aberta", () => {
  const d = dadosVazios();
  igual(lanca(() => deixar(d, { nome: "  ", status: "aberta", linha: "x" }, "2026-11-10"), ErroDeValidacao).campo, "nome");
  igual(lanca(() => deixar(d, { nome: "A", status: "aberta", linha: "  " }, "2026-11-10"), ErroDeValidacao).campo, "linha");
  const ok = deixar(d, { nome: "A", status: "concluida", linha: "" }, "2026-11-10");
  igual(ok.history[0].nota, "");
  igual(ok.history[0].proximoPasso, "");
});

teste("Aberta guarda proximoPasso; Concluída guarda nota", () => {
  let d = deixarEm(dadosVazios(), "2026-11-10", { nome: "A", status: "aberta", linha: " conferir " });
  igual([d.history[0].proximoPasso, d.history[0].nota], ["conferir", ""]);
  d = deixarEm(d, "2026-11-10", { nome: "B", status: "concluida", linha: "enviado" });
  igual([d.history[1].proximoPasso, d.history[1].nota], ["", "enviado"]);
});

// ---------- fila ----------
teste("mesma tarefa em 3 dias: 3 linhas no histórico, fila de cada dia mostra só a mais recente", () => {
  let d = dadosVazios();
  d = deixarEm(d, "2026-11-09", { nome: "Relatório", status: "aberta", linha: "seg" });
  d = deixarEm(d, "2026-11-10", { nome: "Relatório", status: "aberta", linha: "ter-1" }, 9);
  d = deixarEm(d, "2026-11-10", { nome: "relatorio ", status: "aberta", linha: "ter-2" }, 15);
  d = deixarEm(d, "2026-11-11", { nome: "RELATÓRIO", status: "aberta", linha: "qua" });
  igual(d.history.length, 4);
  igual(fila(d, "2026-11-09").map((e) => e.proximoPasso), ["seg"]);
  igual(fila(d, "2026-11-10").map((e) => e.proximoPasso), ["ter-2"]);
  igual(fila(d, "2026-11-11").map((e) => e.proximoPasso), ["qua"]);
  igual(fila(d, "2026-11-12"), []);
});

teste("Concluída tira da fila e nunca entra nela", () => {
  let d = deixarEm(dadosVazios(), "2026-11-10", { nome: "A", status: "aberta", linha: "x" }, 9);
  igual(nomes(fila(d, "2026-11-10")), ["A"]);
  d = deixarEm(d, "2026-11-10", { nome: "a", status: "concluida", linha: "feito" }, 10);
  igual(fila(d, "2026-11-10"), []);
  d = deixarEm(d, "2026-11-10", { nome: "B", status: "concluida", linha: "" }, 11);
  igual(fila(d, "2026-11-10"), []);
});

teste("Concluída seguida de Aberta no mesmo dia: volta à fila (o registro mais recente vale)", () => {
  let d = deixarEm(dadosVazios(), "2026-11-10", { nome: "A", status: "concluida", linha: "" }, 9);
  d = deixarEm(d, "2026-11-10", { nome: "A", status: "aberta", linha: "reaberta" }, 10);
  igual(fila(d, "2026-11-10").map((e) => e.proximoPasso), ["reaberta"]);
});

teste("fila: mais recente primeiro", () => {
  let d = deixarEm(dadosVazios(), "2026-11-10", { nome: "A", status: "aberta", linha: "x" }, 9);
  d = deixarEm(d, "2026-11-10", { nome: "B", status: "aberta", linha: "y" }, 10);
  igual(nomes(fila(d, "2026-11-10")), ["B", "A"]);
});

// ---------- retomar ----------
teste("retomar define a ativa, tira da fila e NÃO cria entrada no histórico", () => {
  let d = deixarEm(dadosVazios(), "2026-11-10", { nome: "A", status: "aberta", linha: "x" });
  d = deixarEm(d, "2026-11-10", { nome: "B", status: "aberta", linha: "y" }, 10);
  const antes = JSON.stringify(d.history);
  const r = retomar(d, "a", "2026-11-10");
  igual(r.active, { nome: "A", proximoPasso: "x", data: "2026-11-10" });
  igual(JSON.stringify(r.history), antes);
  igual(nomes(fila(r, "2026-11-10")), ["B"]);
});

teste("retomar algo fora da fila falha", () => {
  const d = deixarEm(dadosVazios(), "2026-11-10", { nome: "A", status: "concluida", linha: "" });
  lanca(() => retomar(d, "A", "2026-11-10"));
  lanca(() => retomar(d, "Inexistente", "2026-11-10"));
});

teste("deixar a tarefa ativa como Aberta: volta à fila com o novo passo", () => {
  let d = deixarEm(dadosVazios(), "2026-11-10", { nome: "A", status: "aberta", linha: "x" }, 9);
  d = retomar(d, "A", "2026-11-10");
  igual(fila(d, "2026-11-10"), []);
  d = deixarEm(d, "2026-11-10", { nome: "A", status: "aberta", linha: "novo" }, 11);
  igual(d.active, null);
  igual(fila(d, "2026-11-10").map((e) => e.proximoPasso), ["novo"]);
});

// ---------- virada do dia ----------
teste("virada do dia: ativa e fila zeram, histórico intacto", () => {
  let d = deixarEm(dadosVazios(), "2026-11-10", { nome: "A", status: "aberta", linha: "x" });
  d = retomar(d, "A", "2026-11-10");
  const h = JSON.stringify(d.history);
  igual(virarDia(d, "2026-11-10").active?.nome, "A"); // mesmo dia: mantém
  const amanha = virarDia(d, "2026-11-11");
  igual(amanha.active, null);
  igual(fila(amanha, "2026-11-11"), []);
  igual(JSON.stringify(amanha.history), h);
});

// ---------- histórico ----------
teste("histórico por data (recente primeiro) e trajetória", () => {
  let d = dadosVazios();
  d = deixarEm(d, "2026-11-09", { nome: "Relatório", status: "aberta", linha: "seg" });
  d = deixarEm(d, "2026-11-10", { nome: "Relatório", status: "aberta", linha: "ter" });
  d = deixarEm(d, "2026-11-10", { nome: "Outra", status: "aberta", linha: "z" }, 12);
  d = deixarEm(d, "2026-11-11", { nome: "relatório", status: "concluida", linha: "ok" });
  igual(historicoPorData(d).map((g) => g.data), ["2026-11-11", "2026-11-10", "2026-11-09"]);
  igual(historicoPorData(d)[1].entradas.map((e) => e.nome), ["Outra", "Relatório"]);
  igual(trajetoria(d, "RELATORIO").map((e) => e.status), ["aberta", "aberta", "concluida"]);
});

// ---------- pergunta ----------
teste("pergunta: nunca repete a anterior (inclui extremos do rng)", () => {
  let ant = null;
  for (let i = 0; i < 2000; i++) {
    const p = sortear(ant);
    verdade(PERGUNTAS.includes(p), "fora da lista");
    verdade(p !== ant, "repetiu");
    ant = p;
  }
  for (const r of [0, 0.999999, 1]) for (const p of PERGUNTAS) verdade(sortear(p, () => r) !== p, "repetiu no extremo");
});

teste("pergunta: usa todas as variações", () => {
  const vistas = new Set();
  let ant = null;
  for (let i = 0; i < 500; i++) vistas.add((ant = sortear(ant)));
  igual(vistas.size, PERGUNTAS.length);
});

// ---------- exportação ----------
teste("exportação JSON: versão, data e todas as entradas, sem perda", () => {
  let d = deixarEm(dadosVazios(), "2026-11-09", { nome: "A", status: "aberta", linha: "x" });
  d = deixarEm(d, "2026-11-10", { nome: "A", status: "concluida", linha: "feito" });
  const j = JSON.parse(paraJSON(d, em("2026-11-11", 8)));
  igual(j.versao, 1);
  igual(j.history, d.history);
  verdade(!Number.isNaN(Date.parse(j.exportadoEm)), "exportadoEm inválido");
});

teste("exportação Markdown: dias em ordem cronológica, status, passo e nota", () => {
  let d = deixarEm(dadosVazios(), "2026-11-10", { nome: "Relatório", status: "concluida", linha: "enviado" }, 15, 30);
  d = deixarEm(d, "2026-11-09", { nome: "Relatório", status: "aberta", linha: "conferir totais" }, 9, 5);
  const md = paraMarkdown(d, em("2026-11-11", 8));
  verdade(md.startsWith("# Histórico do Estaciona\n\nExportado em 11/11/2026."), "cabeçalho\n" + md);
  verdade(md.indexOf("## 09/11/2026") < md.indexOf("## 10/11/2026"), "ordem dos dias");
  verdade(md.includes("- **Relatório** · Aberta · 09:05 — próximo passo: conferir totais"), "linha aberta\n" + md);
  verdade(md.includes("- **Relatório** · Concluída · 15:30 — nota: enviado"), "linha concluída\n" + md);
});

teste("exportação Markdown: escapa caracteres especiais e aceita histórico vazio", () => {
  const d = deixarEm(dadosVazios(), "2026-11-10", { nome: "*grande* [x] #1", status: "aberta", linha: "a_b" });
  const md = paraMarkdown(d);
  verdade(md.includes("**\\*grande\\* \\[x\\] \\#1**"), md);
  verdade(md.includes("a\\_b"), md);
  verdade(paraMarkdown(dadosVazios()).includes("_Nenhum registro._"), "vazio");
});

// ---------- storage ----------
const backendFalso = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), _m: m };
};

teste("storage: grava e lê de volta; vazio na primeira vez", () => {
  const b = backendFalso();
  const s = criarStorage(b);
  igual(s.carregar(), dadosVazios());
  const d = deixarEm(dadosVazios(), "2026-11-10", { nome: "A", status: "aberta", linha: "x" });
  s.salvar(d);
  igual(criarStorage(b).carregar(), d); // "fechar e reabrir"
});

teste("storage: dados corrompidos não são perdidos (vão para backup)", () => {
  const b = backendFalso();
  b.setItem(CHAVE, "{isto não é json");
  const s = criarStorage(b);
  igual(s.carregar(), dadosVazios());
  igual(b.getItem(CHAVE_BACKUP), "{isto não é json");
});

teste("storage: localStorage indisponível cai para memória sem quebrar", () => {
  const quebrado = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("cheio"); } };
  const s = criarStorage(quebrado);
  const d = deixarEm(dadosVazios(), "2026-11-10", { nome: "A", status: "aberta", linha: "x" });
  s.salvar(d);
  igual(s.carregar(), d);
  igual(s.persistente, false);
  igual(criarStorage(null).persistente, false);
});

teste("storage: última pergunta persiste em chave separada", () => {
  const b = backendFalso();
  const s = criarStorage(b);
  igual(s.lerUltimaPergunta(), null);
  s.gravarUltimaPergunta("O que vamos guardar?");
  igual(criarStorage(b).lerUltimaPergunta(), "O que vamos guardar?");
  igual(criarStorage(b).carregar(), dadosVazios()); // não mistura com os dados
});

export function rodar() {
  const falhas = [];
  for (const { nome, fn } of casos) {
    try {
      fn();
      console.log(`  ok   ${nome}`);
    } catch (e) {
      falhas.push(nome);
      console.error(`  FALHOU ${nome}\n         ${e.message}`);
    }
  }
  const total = casos.length;
  console[falhas.length ? "error" : "log"](`${total - falhas.length}/${total} testes passaram`);
  if (typeof process !== "undefined" && falhas.length) process.exitCode = 1;
  return { total, falhas };
}
