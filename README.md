# Estaciona

Um app minúsculo para **deixar a tarefa atual guardada** na hora de trocar de demanda, sem carregar a pendência na cabeça.

Baseado no método de gestão de resíduo de atenção (Sophie Leroy, 2009) descrito no artigo
[Attention Residue Management: 5-Step Clearing Protocol](https://goalsandprogress.com/) (Goals & Progress).

## O problema

No expediente de TI, as trocas de demanda são frequentes: cerca de 60% planejadas e 40% por interrupção (Teams, casa).
Cada troca deixa "resíduo" da tarefa anterior. Tentativas anteriores com arquivo .md e bloco de papel falharam por dois motivos:

- **Entrada:** abrir o arquivo certo custava cliques demais.
- **Saída:** a anotação não reaparecia na hora de retomar a tarefa.

## Princípios de design

1. **Atrito mínimo na entrada.** Abrir e já estar com o cursor no campo.
2. **Retorno garantido.** O que foi deixado fica sempre visível na tela de início.
3. **Não virar mais uma interrupção.** Sem notificações, sem lembretes, sem gamificação.
4. **Opcional onde há pouca evidência.** O passo central é anotar o próximo passo (Capture). O resto é apoio passivo.
5. **Nada se apaga.** A fila do dia zera na virada, o histórico fica.
6. **O app só sabe o que você conta.** Ele não tenta adivinhar em que tarefa você está.

## Conceitos

Toda tarefa tem um **nome** (obrigatório). Existem só duas ações:

- **Deixar:** registrar o estado de uma tarefa ao sair dela (nome, status, próximo passo ou nota).
- **Retomar:** voltar a uma tarefa que está na fila. Ela mantém o título; o status, a nota e o próximo passo podem mudar na próxima vez em que for deixada.

A **fila** é só uma orientação do que ficou aberto hoje. Você pode retomar o que ela mostra ou ignorá-la e começar outra coisa. Uma tarefa nova só entra no app quando você a deixa pela primeira vez.

## Telas

**Duas telas principais**

1. **Início (deixar + fila):** pergunta no topo, formulário de captura e a fila do dia logo abaixo.
2. **Roteiro:** tela cheia exibida ao salvar. Ao fechar, volta para o Início.

**Telas secundárias** (menu discreto): Técnicas de emergência e Histórico.

## Funcionalidades

- **Pergunta variável no topo do Início**, sorteada a cada abertura, sem repetir a anterior. Variações:
  - "O que deixamos aqui?"
  - "O que fica por aqui?"
  - "O que vamos guardar?"
  - "O que ficou desta tarefa?"
  - "O que deixamos para trás?"
- **Formulário de captura:**
  - **Nome** da tarefa (obrigatório). Se você retomou uma tarefa, vem preenchido e editável.
  - **Status:** Aberta ou Concluída.
  - **Aberta:** pede o *próximo passo* (uma linha) e a tarefa vai para a fila.
  - **Concluída:** nota opcional de uma linha sobre o que foi realizado. A tarefa não entra na fila e, se estava na fila, sai dela.
- **Fila do dia:** lista só com nomes. Mostra apenas o registro mais recente de cada título, e só os que estão Abertos. Ao clicar, mostra o próximo passo e o botão **Retomar**.
- **Indicador "Em andamento · nome"** quando você retoma uma tarefa; senão, "Nenhuma tarefa ativa". Persiste ao fechar e reabrir o app no mesmo dia.
- **Roteiro de transição** em tela cheia ao salvar: Fechar, Limpar, Preparar, Começar. Texto grande, sem cronômetro, sem exigir clique. Fecha com qualquer tecla, com um botão grande ou ao começar a digitar.
- **Técnicas de emergência** (brain dump de 3 minutos, reset sensorial, caminhada): seção de consulta, só texto.
- **Histórico** por data, com a trajetória de cada tarefa, e **exportação** em `.md` e `.json` para a revisão mensal.

## Regras

- **Cada vez que uma tarefa é deixada, cria-se uma nova linha no histórico.** A trajetória fica registrada (ex.: aberta na segunda, aberta na terça, concluída na quarta).
- **Ligação entre registros pelo nome:** títulos iguais (ignorando maiúsculas, acentos e espaços nas pontas) contam como a mesma tarefa.
- **Fila:** para cada título, vale o registro mais recente do dia. Se for Aberta e a tarefa não estiver ativa, aparece na fila. Se for Concluída, ou se estiver ativa, não aparece.
- **Virada do dia:** ao abrir em um novo dia, fila e tarefa ativa começam vazias. O histórico permanece intacto.
- **Dados só no navegador** (`localStorage`). Nada é enviado a servidor.
- Sem login, sem backend, sem build.

## Fora de escopo (por decisão)

- Registro do tipo de troca (planejada/interrupção) e grau de resíduo.
- Cronômetros obrigatórios no roteiro (os tempos do artigo são sugestões do autor, não resultado de estudo).
- Lembretes, notificações, métricas elaboradas, gamificação.
- Sincronização entre dispositivos.
- Cadastro de tarefa nova fora do fluxo "Deixar".

## Stack

HTML, CSS e JavaScript puro (módulos ES), sem dependências. PWA (manifest + service worker) para instalar como janela própria.

## Rodar localmente

Os módulos ES e o service worker não funcionam a partir de `file://`. Sirva a pasta por HTTP:

```
python -m http.server 8000
```

e abra `http://localhost:8000`.

## Usar como aplicativo no Edge

1. Publicar via GitHub Pages (ou rodar um servidor local, como acima; PWA não instala a partir de `file://`).
2. No Edge: menu `...` > **Aplicativos** > **Instalar este site como um aplicativo**.
3. Fixar na barra de tarefas. No Windows, ele abre com `Win + número` (a posição do ícone na barra, contando da esquerda).

Depois de instalado, o app abre mesmo sem rede (service worker). O Chrome instala da mesma forma.

Os dados ficam no navegador de quem usa, mesmo com o site publicado. **Eles são presos ao endereço e ao navegador**: `localhost:8000`, o GitHub Pages, o Edge e o Chrome têm cada um o seu histórico. Antes de mudar de endereço ou de navegador, use **Exportar .json** no Histórico.

## Desenvolvimento

- **Testes de regras** (storage, fila, virada do dia, pergunta, exportação), no terminal com Node:

  ```
  node -e "import('./js/dev/testes.js').then(m => m.rodar())"
  ```

  Ou no console do navegador, com o app aberto: `(await import("./js/dev/testes.js")).rodar()`. Usam um armazenamento falso e não tocam nos seus dados.
- **Service worker:** se a lista de arquivos do app mudar, aumente `VERSAO` em `sw.js`.
- **Decisões de implementação:** [docs/decisoes.md](docs/decisoes.md).

## Privacidade

Os dados ficam sem criptografia no perfil do navegador. Use anotações curtas e genéricas
(onde parei / próximo passo), sem dados de clientes, senhas ou nomes sensíveis.

## Estrutura do projeto

```
estaciona/
  index.html
  manifest.webmanifest
  sw.js               # abre o app offline (rede primeiro, cache como reserva)
  css/
    tokens.css        # fontes locais e variáveis (cores, raios, sombras)
    base.css          # layout das quatro telas
  fonts/              # Fraunces e Inter (locais, sem rede) e licenças
  icons/              # ícones do app (192 e 512 px), também usados como favicon
  js/
    main.js           # inicialização, estado em memória, troca de telas
    storage.js        # leitura/escrita no localStorage (com reserva em memória)
    state.js          # regras puras: ativa, fila derivada, virada do dia
    prompts.js        # variações da pergunta e sorteio sem repetir
    export.js         # exportar histórico em .md e .json
    views/
      home.js         # indicador + pergunta + formulário + fila
      ritual.js       # roteiro em tela cheia
      history.js      # histórico por data e botões de exportação
    dev/
      testes.js       # testes de console (não carregados pelo app)
  docs/
    decisoes.md
```

As técnicas de emergência são só texto e ficam no próprio `index.html`.

## Roadmap

- [x] v0.1 Arquitetura e fluxo funcional
- [x] v0.2 Layout, a partir do protótipo `Estaciona.html`
- [x] v0.3 PWA instalável (Edge e Chrome)
- [x] v0.4 Exportação em `.md` e `.json` para a revisão mensal
- [ ] Revisão de acessibilidade completa (ordem de Tab em todas as telas, leitor de tela, contraste)

## Licença

A definir.