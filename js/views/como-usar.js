// Tela "Como usar": esconde o bloco de instalação quando o app já roda como aplicativo
// (janela própria, display-mode: standalone). No navegador comum o bloco aparece.

export function iniciarComoUsar() {
  const bloco = document.querySelector("#bloco-instalar");
  const instalado = window.matchMedia("(display-mode: standalone)");
  const aplicar = () => {
    bloco.hidden = instalado.matches;
  };
  aplicar();
  instalado.addEventListener("change", aplicar);
}
