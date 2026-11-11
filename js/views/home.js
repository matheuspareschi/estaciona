// Tela de Início: indicador, pergunta, formulário Deixar e fila do dia.
// Só mexe no DOM e chama as regras de state.js. Textos de usuário entram sempre por textContent.

import { ErroDeValidacao, deixar, fila, retomar } from "../state.js";

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

const TEXTOS_LINHA = {
  aberta: { rotulo: "Próximo passo", placeholder: "Uma linha: por onde retomar" },
  concluida: { rotulo: "O que foi realizado? (opcional)", placeholder: "Uma linha basta" },
};

/**
 * @param {{ estado: {dados: object, hoje: string}, persistir: (dados: object) => void,
 *           aoSalvar: () => void, pergunta: string }} deps
 */
export function iniciarHome({ estado, persistir, aoSalvar, pergunta }) {
  const indicador = $("#indicador");
  const indicadorTexto = $(".indicador-texto", indicador);
  const form = $("#form-deixar");
  const campoNome = $("#campo-nome");
  const campoLinha = $("#campo-linha");
  const rotuloLinha = $("#rotulo-linha");
  const erro = $("#erro-form");
  const lista = $("#fila");
  const vazia = $("#fila-vazia");
  const modelo = $("#tpl-fila-item");
  let contador = 0;

  $("#pergunta").textContent = pergunta;

  const statusAtual = () => form.elements.status.value;

  function renderIndicador() {
    const ativa = estado.dados.active;
    indicador.dataset.ativo = ativa ? "true" : "false";
    indicadorTexto.textContent = ativa ? `Em andamento · ${ativa.nome}` : "Nenhuma tarefa ativa";
  }

  function criarItem(entrada) {
    const li = modelo.content.firstElementChild.cloneNode(true);
    const id = `painel-fila-${++contador}`;
    const botao = $(".fila-toggle", li);
    const painel = $(".fila-painel", li);
    li.dataset.tarefa = entrada.nome;
    $(".fila-nome", li).textContent = entrada.nome;
    $(".proximo-passo", li).textContent = entrada.proximoPasso;
    painel.id = id;
    botao.setAttribute("aria-controls", id);
    return li;
  }

  function renderFila() {
    const itens = fila(estado.dados, estado.hoje);
    lista.replaceChildren(...itens.map(criarItem));
    lista.hidden = itens.length === 0;
    vazia.hidden = itens.length > 0;
  }

  function render() {
    renderIndicador();
    renderFila();
  }

  function atualizarLinha() {
    const t = TEXTOS_LINHA[statusAtual()];
    rotuloLinha.textContent = t.rotulo;
    campoLinha.placeholder = t.placeholder;
    campoLinha.required = statusAtual() === "aberta";
  }

  function limparErro() {
    erro.hidden = true;
    erro.textContent = "";
    campoNome.removeAttribute("aria-invalid");
    campoLinha.removeAttribute("aria-invalid");
  }

  function mostrarErro(campo, mensagem) {
    limparErro();
    const alvo = campo === "nome" ? campoNome : campoLinha;
    erro.textContent = mensagem;
    erro.hidden = false;
    alvo.setAttribute("aria-invalid", "true");
    alvo.focus();
  }

  /** Preenche o nome com a tarefa ativa (editável). */
  function preencherNomeAtiva() {
    if (estado.dados.active) campoNome.value = estado.dados.active.nome;
  }

  // ----- eventos -----
  form.addEventListener("change", (e) => {
    if (e.target.name === "status") atualizarLinha();
  });

  form.addEventListener("input", (e) => {
    if (e.target.getAttribute("aria-invalid")) limparErro();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    limparErro();
    let novo;
    try {
      novo = deixar(
        estado.dados,
        { nome: campoNome.value, status: statusAtual(), linha: campoLinha.value },
        estado.hoje,
      );
    } catch (err) {
      if (err instanceof ErroDeValidacao) return mostrarErro(err.campo, err.message);
      throw err;
    }
    persistir(novo);
    form.reset(); // limpa campos e volta o status para Aberta
    atualizarLinha();
    render();
    aoSalvar();
  });

  lista.addEventListener("click", (e) => {
    const toggle = e.target.closest(".fila-toggle");
    if (toggle) {
      const li = toggle.closest("li");
      const abrir = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(abrir));
      $(".fila-painel", li).hidden = !abrir;
      li.classList.toggle("aberto", abrir);
      return;
    }
    const botaoRetomar = e.target.closest(".btn-retomar");
    if (botaoRetomar) {
      persistir(retomar(estado.dados, botaoRetomar.closest("li").dataset.tarefa, estado.hoje));
      limparErro();
      preencherNomeAtiva();
      render();
      campoNome.focus(); // o botão Retomar saiu da tela; o foco vai para o formulário
    }
  });

  atualizarLinha();
  preencherNomeAtiva();
  render();

  return {
    render,
    focar: () => campoNome.focus(),
  };
}
