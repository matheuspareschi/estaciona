# Decisões

Registro das decisões de implementação do v0.1 e do porquê de cada uma.

## Layout de referência

- **O guia visual é o `Estaciona.html`** (protótipo com Início, Roteiro e Emergência). Um `index.html` anterior, em outro estilo (teal, Plus Jakarta Sans), foi descartado e movido com seus CSS, fontes e `design-system/` para `_arquivo/`, sem apagar nada.
- **O Histórico não existe no protótipo.** Será criado reaproveitando o vocabulário visual dele (cartão creme, selo em pílula, botão secundário de borda verde).
- **Fontes locais** (`fonts/`): Fraunces (normal e itálico) e Inter, extraídas do próprio protótipo, que as embutia. Licenças em `fonts/LICENSES.txt`. Nenhuma requisição externa.

## Modelo de dados e regras (`js/state.js`, `js/storage.js`)

- **Funções puras.** `state.js` recebe dados e data e devolve dados novos, sem DOM nem localStorage. Isso permite testar tudo no console (`js/dev/testes.js`) e deixa a interface fina.
- **Data local, não UTC.** `hoje()` monta AAAA-MM-DD com os campos locais. `toISOString()` viraria o dia às 21h no horário de Brasília.
- **Virada do dia derivada.** Não há "dia atual" salvo. A ativa some quando `active.data !== hoje`. A fila é derivada do history filtrando por `data === hoje`, então zera sozinha e nada é apagado.
- **Deixar sempre cria entrada nova** (id único, `criadoEm` em ISO) e zera a ativa. Aberta guarda `proximoPasso` e deixa `nota` vazia. Concluída faz o inverso.
- **Empate na "entrada mais recente do dia":** vale o maior `criadoEm`; em igualdade, a gravada depois.
- **Concluída seguida de Aberta no mesmo dia** devolve a tarefa à fila: o registro mais recente é o que vale (regra do README).
- **Ordem da fila: mais recente primeiro.** O que acabou de ser deixado é o mais provável de ser retomado.
- **Retomar** só define `active`. Não toca no history. Se já havia ativa, é substituída. Retomar algo fora da fila é erro.
- **Identidade pelo nome normalizado** (sem acentos, minúsculas, pontas aparadas). Espaços internos não são colapsados, porque o README só fala das pontas. O nome exibido é o da entrada mais recente.
- **Armazenamento:** chave `estaciona:v1` guarda `{ history, active }`. A última pergunta fica em `estaciona:v1:ultimaPergunta`, separada, para que mexer nos dados não afete o sorteio.
- **Dados ilegíveis nunca são descartados:** o conteúdo bruto vai para `estaciona:v1:corrompido` antes de começar do zero.
- **localStorage indisponível** (modo restrito, cota cheia): o app continua funcionando em memória e expõe `persistente = false` para a interface poder avisar.

## Pergunta variável (`js/prompts.js`)

- Sorteia entre as variações excluindo a anterior, então nunca repete. A anterior é guardada por texto (não por índice), para sobreviver a mudanças na lista.

## Início, Roteiro e navegação (`index.html`, `css/`, `js/main.js`, `js/views/`)

- **Protótipo convertido sem mudar o visual.** Os estilos inline do `Estaciona.html` viraram classes em `css/base.css` com variáveis em `css/tokens.css`, usando os mesmos valores. Conferido por captura de tela em 1280×800 contra o protótipo.
- **Radios nativos no lugar dos botões `aria-pressed`.** O protótipo usava dois botões para Aberta/Concluída. Agora são `input[type=radio][name=status]` escondidos, com o `<label>` desenhado como a mesma pílula. Teclado (setas) e leitor de tela funcionam sem código extra.
- **Layout fluido, com o desenho de 1280px preservado.** O rodapé deixou de ser `position: absolute` (cobriria conteúdo longo) e passou a ficar no fim da coluna da tela. Abaixo de 56rem as colunas empilham. Não há tema escuro, porque o protótipo é só claro.
- **Indicador sem tarefa ativa:** o protótipo só mostra o estado "ativa". Para "Nenhuma tarefa ativa" uso a mesma pílula em tom neutro (`--cor-segmento`), para o verde significar "há algo em andamento".
- **Fila vazia:** texto "Nada na fila hoje." dentro do cartão, sem borda nova.
- **Cor do erro** `#8a5a3f`: o terracota do protótipo (`#9a6b4f`) ficava com contraste de 4,2:1 sobre o fundo; escurecido chega a 5,4:1.
- **Rodapé em cada tela** (Início: Emergência e Histórico; demais: Início), como no protótipo. A área de clique dos links é ampliada com `::after`, sem alterar o layout.
- **Roteiro:** textos do protótipo, sem legenda de como fechar. Fecha com o botão X, Esc ou qualquer tecla. Ignora Tab e modificadores (para não prender o foco), atalhos com Ctrl/Alt/Meta e `e.repeat` (Enter mantido pressionado ao salvar fechava o Roteiro no mesmo instante). O foco vai ao `#campo-nome`, e o caractere digitado cai nele, então "começar a digitar" já começa a digitar.
- **Salvar zera a ativa** (regra 5). Se havia uma tarefa ativa e você deixa outra, a ativa volta para a fila quando seu último registro do dia é Aberta. Comportamento esperado, não bug.
- **Retomar** preenche o nome com a tarefa e move o foco para o `#campo-nome`, porque o botão Retomar sai da tela e o foco não pode se perder.
- **Pergunta sorteada na abertura da página**, não a cada troca de tela.
- **Virada do dia com a janela aberta:** a data é conferida ao voltar à janela (`visibilitychange` e `focus`). Não há temporizador.
- **Segurança:** nomes e textos do usuário entram sempre por `textContent`, nunca `innerHTML`.
- **Sem aviso visual** quando o localStorage está indisponível (o protótipo não prevê onde mostrar). O app segue em memória e `storage.persistente` fica `false`.

## Histórico e exportação (`js/views/history.js`, `js/export.js`)

- **Lista por data**, da mais recente para a mais antiga, e dentro do dia a entrada mais recente primeiro. Cada entrada mostra nome, selo de status e "Próximo passo:" (Aberta) ou "Nota:" (Concluída).
- **Trajetória** em uma linha extra ("Trajetória: Aberta 09/11 → Aberta 10/11 → Concluída 11/11"), só quando a tarefa tem mais de um registro. Ligação pelo nome normalizado, então "relatorio de chamados" e "Relatório de chamados" contam como a mesma tarefa.
- **A tela do Histórico não existe no protótipo.** Reaproveita cartão creme, borda `#eadfcc`, selo em pílula (como o "3 min") e botão de borda verde (como o "Retomar"). Os selos Aberta/Concluída usam as cores já existentes (`--cor-segmento` e `--cor-selo`).
- **Exportação `.json`:** `{ versao: 1, exportadoEm, history }` com as entradas exatamente como estão guardadas, na ordem em que foram gravadas. É o formato para reprocessar depois.
- **Exportação `.md`:** feita para ler na revisão mensal. Dias em ordem cronológica (o histórico na tela é o inverso), entradas do dia na ordem em que foram deixadas, com hora local. Uma linha por registro: `- **Nome** · Status · HH:MM — próximo passo/nota`. Não agrupa por tarefa, para não esconder a ordem do dia.
- **Markdown escapado:** nome e textos são livres, então `\ ` * _ [ ] < > #` recebem barra invertida, e quebras de linha viram espaço.
- **Nomes de arquivo:** `estaciona-historico-AAAA-MM-DD.md|json` com a data local. O download é feito por `Blob` e `<a download>`, sem rede.
- **Atualização:** a lista é refeita sempre que a tela abre e na virada do dia.

## Verificação

- `js/dev/testes.js`: 23 testes de regras, storage, pergunta e exportação.
- Verificação no Edge (headless, via protocolo de depuração): 45 checagens que cobrem validação, Roteiro, fila, retomar, reabertura no mesmo dia, virada de dia, Emergência, Histórico, trajetória, os dois downloads e ausência de requisições externas. O script não faz parte do repositório.

## PWA (`manifest.webmanifest`, `sw.js`, `icons/`)

- **Ícone:** "E" em Fraunces itálico, creme (`#faf6ee`) sobre o verde-sálvia (`#4f6b52`), a mesma marca do rodapé. Gerado a partir da própria fonte do app, em 192 e 512 px. O quadrado vai sem cantos arredondados e o glifo fica na zona segura central, então o mesmo arquivo serve para `any` e `maskable`. Também é o favicon, o que elimina o 404.
- **Manifest:** `display: standalone`, `start_url` e `scope` relativos (`./`), para funcionar tanto em `localhost` quanto em um GitHub Pages dentro de subpasta. `background_color` e `theme_color` são `#faf6ee`, o fundo do app.
- **Service worker: rede primeiro, cache como reserva.** Com conexão, uma versão nova aparece na hora e os módulos JS nunca se misturam entre versões. Sem conexão, o app abre do cache. Escolhi isso em vez de "cache primeiro" porque o app é pessoal e atualizar manualmente um número de versão a cada ajuste seria fácil de esquecer.
- **Pré-cache** de todos os arquivos do app na instalação. Se a lista de arquivos mudar, é preciso aumentar `VERSAO` em `sw.js`; caches de versões antigas são apagados na ativação.
- **O service worker só atende GET da mesma origem** e nunca toca no localStorage. A exigência de "nenhuma requisição de rede" continua valendo: ele não faz nenhuma chamada externa.
- **Registro** em `main.js`, sem mostrar erro: se o navegador não permitir (por exemplo `file://`), o app funciona normalmente, só sem instalar nem abrir offline.
- **Verificado no Edge:** service worker ativo, 18 arquivos em cache, manifest sem erros, sem erros de instalabilidade, e o app abrindo offline com fila, Histórico e fontes intactos.
