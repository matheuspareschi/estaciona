// Roteiro em tela cheia. Sem cronômetro e sem exigir clique.
// Fecha com o botão X, com Esc ou com qualquer tecla (começar a digitar também fecha;
// o caractere digitado cai no campo de nome, que recebe o foco ao voltar ao Início).

const SO_MODIFICADORA = new Set(["Tab", "Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock", "NumLock"]);

/** @param {{ ir: (tela: string) => void }} deps */
export function iniciarRitual({ ir }) {
  const tela = document.querySelector("#roteiro");
  const botao = document.querySelector("#btn-fechar-roteiro");

  const aberto = () => !tela.hidden;
  const fechar = () => {
    if (aberto()) ir("inicio");
  };

  botao.addEventListener("click", fechar);

  document.addEventListener("keydown", (e) => {
    if (!aberto()) return;
    if (SO_MODIFICADORA.has(e.key)) return; // Tab fica livre para não prender o foco
    if (e.repeat) return; // Enter mantido pressionado ao salvar não pode fechar na hora
    if (e.ctrlKey || e.metaKey || e.altKey) return; // atalhos do navegador seguem funcionando
    fechar();
  });

  return { abrir: () => ir("roteiro") };
}
