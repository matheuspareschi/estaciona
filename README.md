# Estaciona

Um app minúsculo para **estacionar a tarefa atual** na hora de trocar de demanda, sem carregar a pendência na cabeça.

Baseado no método de gestão de resíduo de atenção (Sophie Leroy, 2009) descrito no artigo
[Attention Residue Management: 5-Step Clearing Protocol](https://goalsandprogress.com/) (Goals & Progress).

## O problema

No expediente de TI, as trocas de demanda são frequentes: cerca de 60% planejadas e 40% por interrupção (Teams, casa).
Cada troca deixa "resíduo" da tarefa anterior. Tentativas anteriores com arquivo .md e bloco de papel falharam por dois motivos:

- **Entrada:** abrir o arquivo certo custava cliques demais.
- **Saída:** a anotação não reaparecia na hora de retomar a tarefa.

## Princípios de design

1. **Atrito mínimo na entrada.** Abrir e já estar com o cursor no campo.
2. **Retorno garantido.** O que foi estacionado fica sempre visível na tela principal.
3. **Não virar mais uma interrupção.** Sem notificações, sem lembretes, sem gamificação.
4. **Opcional onde há pouca evidência.** O passo central é anotar o próximo passo (Capture). O resto é apoio passivo.
5. **Nada se apaga.** A fila do dia zera na virada, o histórico fica.

## Funcionalidades

- **Tarefa ativa** no topo ("Em andamento" ou "Nenhuma tarefa ativa"), persistida ao fechar e reabrir.
- **Trocar de tarefa** (formulário):
  - Nome da tarefa (preenchido com a tarefa ativa, editável).
  - **Aberta:** pede o *próximo passo* e envia a tarefa para o estacionamento.
  - **Concluída:** nota opcional de uma linha sobre o que foi realizado. Não entra no estacionamento.
- **Estacionamento do dia:** lista só com os nomes. Ao clicar, mostra o próximo passo e a opção **Iniciar**, que torna a tarefa ativa e a tira da fila.
- **Roteiro de transição** em tela cheia, depois de salvar: Fechar, Limpar, Preparar, Começar. Texto grande, sem cronômetro, sem exigir clique. Some ao começar a digitar ou ao fechar.
- **Técnicas de emergência** (brain dump de 3 minutos, reset sensorial, caminhada): seção de consulta, só texto.
- **Histórico** por data, com **exportação** em `.md` e `.json` para a revisão mensal.

## Regras

- **Virada do dia:** ao abrir em um novo dia, fila e tarefa ativa começam vazias. O histórico permanece intacto.
- **Dados só no navegador** (`localStorage`). Nada é enviado a servidor.
- Sem login, sem backend, sem build.

## Fora de escopo (por decisão)

- Registro do tipo de troca (planejada/interrupção) e grau de resíduo.
- Cronômetros obrigatórios no roteiro (os tempos do artigo são sugestões do autor, não resultado de estudo).
- Lembretes, notificações, métricas elaboradas, gamificação.
- Sincronização entre dispositivos.

## Stack

HTML, CSS e JavaScript puro (módulos ES), sem dependências. PWA (manifest + service worker) para instalar como janela própria.

## Usar como aplicativo no Edge

1. Publicar via GitHub Pages (ou rodar um servidor local; PWA não instala a partir de `file://`).
2. No Edge: menu `...` > **Aplicativos** > **Instalar este site como um aplicativo**.
3. Fixar na barra de tarefas. No Windows, ele abre com `Win + número` (a posição do ícone).

Os dados ficam no navegador de quem usa, mesmo com o site publicado.

## Privacidade

Os dados ficam sem criptografia no perfil do navegador. Use anotações curtas e genéricas
(onde parei / próximo passo), sem dados de clientes, senhas ou nomes sensíveis.

## Estrutura planejada

```
estaciona/
  index.html
  manifest.webmanifest
  sw.js
  css/
    base.css          # reset e estrutura neutra (layout visual vem depois, via skill)
  js/
    main.js           # inicialização e roteamento de views
    storage.js        # leitura/escrita no localStorage
    state.js          # estado e regras (ativa, fila, virada do dia)
    export.js         # exportar histórico em .md e .json
    views/
      home.js         # tarefa ativa + estacionamento
      switch.js       # formulário de troca
      ritual.js       # roteiro em tela cheia
      emergency.js    # técnicas de emergência
      history.js      # histórico e exportação
  docs/
    decisoes.md
```

## Roadmap

- [ ] v0.1 Arquitetura e fluxo funcional (sem estilo)
- [ ] v0.2 Layout e acessibilidade (skill ui-ux-pro-max)
- [ ] v0.3 PWA instalável no Edge
- [ ] v0.4 Exportação para revisão mensal

## Licença

A definir.
