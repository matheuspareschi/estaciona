// Regras do app. Funções puras: recebem os dados e a data, devolvem dados novos.
// Não tocam no DOM nem no localStorage.
//
// dados = { history: Entrada[], active: { nome, proximoPasso, data } | null }
// Entrada = { id, nome, status: "aberta"|"concluida", proximoPasso, nota, data, criadoEm }

export class ErroDeValidacao extends Error {
  constructor(campo, mensagem) {
    super(mensagem);
    this.name = "ErroDeValidacao";
    this.campo = campo; // "nome" | "linha"
  }
}

/** Chave de identidade: sem acentos, minúsculas, sem espaços nas pontas. */
export function normalizar(nome) {
  return String(nome ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Data LOCAL no formato AAAA-MM-DD (toISOString usaria UTC e viraria o dia às 21h no Brasil). */
export function hoje(agora = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`;
}

/** "2026-11-10" → "10/11/2026" */
export function formatarData(data) {
  const [a, m, d] = String(data).split("-");
  return `${d}/${m}/${a}`;
}

function novoId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Virada do dia: a ativa de outro dia some. O history não é tocado. */
export function virarDia(dados, dataHoje) {
  if (dados.active && dados.active.data !== dataHoje) return { ...dados, active: null };
  return dados;
}

/**
 * Deixar uma tarefa: SEMPRE cria uma entrada nova e zera a ativa.
 * Aberta exige o próximo passo; Concluída aceita nota opcional.
 */
export function deixar(dados, { nome, status, linha }, dataHoje, agora = new Date()) {
  const nomeLimpo = String(nome ?? "").trim();
  const texto = String(linha ?? "").trim();
  if (!nomeLimpo) throw new ErroDeValidacao("nome", "Informe o nome da tarefa.");
  if (status !== "aberta" && status !== "concluida") throw new Error(`Status inválido: ${status}`);
  if (status === "aberta" && !texto) throw new ErroDeValidacao("linha", "Informe o próximo passo.");

  const entrada = {
    id: novoId(),
    nome: nomeLimpo,
    status,
    proximoPasso: status === "aberta" ? texto : "",
    nota: status === "concluida" ? texto : "",
    data: dataHoje,
    criadoEm: agora.toISOString(),
  };
  return { history: [...dados.history, entrada], active: null };
}

/** Fila do dia, derivada do history (nada é duplicado). Mais recente primeiro. */
export function fila(dados, dataHoje) {
  const ativa = dados.active && dados.active.data === dataHoje ? normalizar(dados.active.nome) : null;
  const maisRecente = new Map();
  for (const e of dados.history) {
    if (e.data !== dataHoje) continue;
    const chave = normalizar(e.nome);
    const atual = maisRecente.get(chave);
    // >= : em empate de criadoEm vale a que foi gravada depois
    if (!atual || e.criadoEm >= atual.criadoEm) maisRecente.set(chave, e);
  }
  return [...maisRecente.values()]
    .filter((e) => e.status === "aberta" && normalizar(e.nome) !== ativa)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : a.criadoEm > b.criadoEm ? -1 : 0));
}

/** Retomar: só define a ativa. Não cria entrada no history. */
export function retomar(dados, nome, dataHoje) {
  const chave = normalizar(nome);
  const item = fila(dados, dataHoje).find((e) => normalizar(e.nome) === chave);
  if (!item) throw new Error(`"${nome}" não está na fila de hoje.`);
  return { ...dados, active: { nome: item.nome, proximoPasso: item.proximoPasso, data: dataHoje } };
}

/** Histórico agrupado por data (mais recente primeiro), entradas também da mais recente para a mais antiga. */
export function historicoPorData(dados) {
  const grupos = new Map();
  for (const e of dados.history) {
    if (!grupos.has(e.data)) grupos.set(e.data, []);
    grupos.get(e.data).push(e);
  }
  const porRecencia = (a, b) => (a.criadoEm < b.criadoEm ? 1 : a.criadoEm > b.criadoEm ? -1 : 0);
  return [...grupos.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([data, entradas]) => ({ data, entradas: entradas.sort(porRecencia) }));
}

/** Todas as entradas de uma tarefa (pelo nome normalizado), da mais antiga para a mais nova. */
export function trajetoria(dados, nome) {
  const chave = normalizar(nome);
  return dados.history
    .filter((e) => normalizar(e.nome) === chave)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? -1 : a.criadoEm > b.criadoEm ? 1 : 0));
}
