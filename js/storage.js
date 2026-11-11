// Leitura e escrita no localStorage. Sem regras de negócio (ver state.js).
// Se o localStorage estiver indisponível (modo restrito, cota), cai para memória
// e marca `persistente = false` para a interface poder avisar.

export const CHAVE = "estaciona:v1";
export const CHAVE_PERGUNTA = "estaciona:v1:ultimaPergunta";
export const CHAVE_BACKUP = "estaciona:v1:corrompido";

export const dadosVazios = () => ({ history: [], active: null });

function backendPadrao() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function dadosValidos(d) {
  return d && typeof d === "object" && Array.isArray(d.history);
}

export function criarStorage(backend = backendPadrao()) {
  const memoria = new Map();
  const api = { persistente: Boolean(backend) };

  function ler(chave) {
    if (backend) {
      try {
        return backend.getItem(chave);
      } catch {
        api.persistente = false;
      }
    }
    return memoria.has(chave) ? memoria.get(chave) : null;
  }

  function gravar(chave, valor) {
    memoria.set(chave, valor);
    if (backend) {
      try {
        backend.setItem(chave, valor);
        api.persistente = true;
      } catch {
        api.persistente = false;
      }
    }
  }

  api.carregar = function carregar() {
    const bruto = ler(CHAVE);
    if (bruto === null) return dadosVazios();
    try {
      const d = JSON.parse(bruto);
      if (!dadosValidos(d)) throw new Error("formato inesperado");
      return { history: d.history, active: d.active ?? null };
    } catch {
      // Nunca descarta dados ilegíveis: guarda uma cópia antes de começar do zero.
      gravar(CHAVE_BACKUP, bruto);
      return dadosVazios();
    }
  };

  api.salvar = function salvar(dados) {
    gravar(CHAVE, JSON.stringify({ history: dados.history, active: dados.active ?? null }));
  };

  api.lerUltimaPergunta = () => ler(CHAVE_PERGUNTA);
  api.gravarUltimaPergunta = (texto) => gravar(CHAVE_PERGUNTA, String(texto));

  return api;
}

export const storage = criarStorage();
