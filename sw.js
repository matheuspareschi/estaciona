// Service worker do Estaciona: só faz o app abrir offline. Não toca nos dados (localStorage).
// Estratégia: rede primeiro, cache como reserva. Assim uma versão nova aparece na hora quando há
// conexão (sem misturar arquivos velhos e novos dos módulos), e o app segue abrindo sem rede.
// Só atende GET da mesma origem; nunca faz requisição para fora.
//
// Ao publicar uma versão que mude a lista de arquivos abaixo, aumente VERSAO.

const VERSAO = "v1";
const CACHE = `estaciona-${VERSAO}`;

const ARQUIVOS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/tokens.css",
  "css/base.css",
  "js/main.js",
  "js/storage.js",
  "js/state.js",
  "js/prompts.js",
  "js/export.js",
  "js/views/home.js",
  "js/views/ritual.js",
  "js/views/history.js",
  "fonts/fraunces-latin-wght-normal.woff2",
  "fonts/fraunces-latin-wght-italic.woff2",
  "fonts/inter-latin-wght-normal.woff2",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c.startsWith("estaciona-") && c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  if (new URL(pedido.url).origin !== self.location.origin) return;

  evento.respondWith(
    fetch(pedido)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(pedido, copia));
        }
        return resposta;
      })
      .catch(() => caches.match(pedido, { ignoreSearch: true }).then((guardada) => guardada || (pedido.mode === "navigate" ? caches.match("index.html") : Response.error()))),
  );
});
