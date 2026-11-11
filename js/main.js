// Inicialização, estado em memória e troca de telas.

import { storage } from "./storage.js";
import { hoje, virarDia } from "./state.js";
import { sortear } from "./prompts.js";
import { iniciarHome } from "./views/home.js";
import { iniciarRitual } from "./views/ritual.js";
import { iniciarHistorico } from "./views/history.js";
import { iniciarComoUsar } from "./views/como-usar.js";

const estado = { dados: storage.carregar(), hoje: hoje() };

function persistir(dados) {
  estado.dados = dados;
  storage.salvar(dados);
}

/** Virada do dia: zera a ativa se ela é de outro dia (o histórico fica). */
function sincronizarDia() {
  estado.hoje = hoje();
  const dados = virarDia(estado.dados, estado.hoje);
  if (dados !== estado.dados) persistir(dados);
}

// ---------- telas ----------
const telas = [...document.querySelectorAll("[data-view]")];

function ir(nome) {
  const alvo = telas.find((t) => t.dataset.view === nome);
  if (!alvo) return;
  for (const t of telas) t.hidden = t !== alvo;
  document.title = alvo.dataset.titulo || "Estaciona";
  window.scrollTo(0, 0);
  if (nome === "inicio") home.focar();
  else if (nome === "historico") { historico.render(); alvo.querySelector("h1").focus(); }
  else if (nome === "roteiro") document.querySelector("#btn-fechar-roteiro").focus();
  else alvo.querySelector("h1")?.focus();
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-ir]");
  if (!link) return;
  e.preventDefault();
  ir(link.dataset.ir);
});

// ---------- início ----------
sincronizarDia();

const perguntaAnterior = storage.lerUltimaPergunta();
const pergunta = sortear(perguntaAnterior);
storage.gravarUltimaPergunta(pergunta);

const ritual = iniciarRitual({ ir });
const historico = iniciarHistorico({ estado });
iniciarComoUsar();
const home = iniciarHome({ estado, persistir, aoSalvar: () => ritual.abrir(), pergunta });
ir("inicio");

// A janela instalada pode ficar aberta de um dia para o outro: confere a data ao voltar a ela.
function aoVoltar() {
  if (document.visibilityState === "hidden") return;
  if (hoje() === estado.hoje) return;
  sincronizarDia();
  home.render();
  historico.render();
}
document.addEventListener("visibilitychange", aoVoltar);
window.addEventListener("focus", aoVoltar);

// PWA: permite abrir offline e instalar como janela própria. Só em http(s); falha em silêncio.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
