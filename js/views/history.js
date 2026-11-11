// Tela de Histórico: lista por data, trajetória de cada tarefa e exportação.

import { formatarData, historicoPorData, hoje, trajetoria } from "../state.js";
import { baixar, paraJSON, paraMarkdown } from "../export.js";

const ROTULO = { aberta: "Aberta", concluida: "Concluída" };

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

/** "Aberta 09/11 → Aberta 10/11 → Concluída 11/11" (só quando a tarefa tem mais de um registro). */
function textoTrajetoria(dados, nome) {
  const passos = trajetoria(dados, nome);
  if (passos.length < 2) return "";
  return "Trajetória: " + passos.map((e) => `${ROTULO[e.status]} ${formatarData(e.data).slice(0, 5)}`).join(" → ");
}

/** @param {{ estado: {dados: object} }} deps */
export function iniciarHistorico({ estado }) {
  const lista = document.querySelector("#lista-historico");
  let contador = 0;

  function criarEntrada(e) {
    const li = el("li");
    li.append(el("span", "hist-nome", e.nome), el("span", `selo selo-${e.status}`, ROTULO[e.status]));
    const detalhe = e.status === "aberta" ? e.proximoPasso && `Próximo passo: ${e.proximoPasso}` : e.nota && `Nota: ${e.nota}`;
    if (detalhe) li.append(el("span", "hist-texto", detalhe));
    const traj = textoTrajetoria(estado.dados, e.nome);
    if (traj) li.append(el("span", "hist-trajetoria", traj));
    return li;
  }

  function render() {
    const grupos = historicoPorData(estado.dados);
    if (grupos.length === 0) {
      lista.replaceChildren(el("p", "historico-vazio", "Nada guardado ainda."));
      return;
    }
    lista.replaceChildren(
      ...grupos.map(({ data, entradas }) => {
        const secao = el("section", "grupo-dia");
        const id = `dia-historico-${++contador}`;
        const titulo = el("h2", "", formatarData(data));
        titulo.id = id;
        secao.setAttribute("aria-labelledby", id);
        const ul = el("ul", "historico");
        ul.append(...entradas.map(criarEntrada));
        secao.append(titulo, ul);
        return secao;
      }),
    );
  }

  document.querySelector("#btn-exportar-md").addEventListener("click", () => {
    baixar(`estaciona-historico-${hoje()}.md`, paraMarkdown(estado.dados), "text/markdown");
  });
  document.querySelector("#btn-exportar-json").addEventListener("click", () => {
    baixar(`estaciona-historico-${hoje()}.json`, paraJSON(estado.dados), "application/json");
  });

  render();
  return { render };
}
