// Exportação do histórico: .json (dados completos) e .md (leitura para a revisão mensal).

import { formatarData, hoje } from "./state.js";

const ROTULO_STATUS = { aberta: "Aberta", concluida: "Concluída" };

const porCriacao = (a, b) => (a.criadoEm < b.criadoEm ? -1 : a.criadoEm > b.criadoEm ? 1 : 0);

/** Escapa o que o Markdown interpretaria (nomes e notas são texto livre). */
function esc(texto) {
  return String(texto).replace(/[\\`*_[\]<>#]/g, "\\$&").replace(/\s*\n\s*/g, " ");
}

function hora(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return Number.isNaN(d.getTime()) ? "" : `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function paraJSON(dados, agora = new Date()) {
  return JSON.stringify({ versao: 1, exportadoEm: agora.toISOString(), history: dados.history }, null, 2);
}

/** Dias em ordem cronológica, e dentro de cada dia as entradas na ordem em que foram deixadas. */
export function paraMarkdown(dados, agora = new Date()) {
  const linhas = ["# Histórico do Estaciona", "", `Exportado em ${formatarData(hoje(agora))}.`];

  if (dados.history.length === 0) {
    linhas.push("", "_Nenhum registro._");
    return linhas.join("\n") + "\n";
  }

  const dias = new Map();
  for (const e of [...dados.history].sort(porCriacao)) {
    if (!dias.has(e.data)) dias.set(e.data, []);
    dias.get(e.data).push(e);
  }

  for (const data of [...dias.keys()].sort()) {
    linhas.push("", `## ${formatarData(data)}`, "");
    for (const e of dias.get(data)) {
      const detalhe =
        e.status === "aberta"
          ? e.proximoPasso && `próximo passo: ${esc(e.proximoPasso)}`
          : e.nota && `nota: ${esc(e.nota)}`;
      const h = hora(e.criadoEm);
      linhas.push(`- **${esc(e.nome)}** · ${ROTULO_STATUS[e.status] ?? e.status}${h ? ` · ${h}` : ""}${detalhe ? ` — ${detalhe}` : ""}`);
    }
  }
  return linhas.join("\n") + "\n";
}

/** Baixa um arquivo pelo navegador (sem rede). */
export function baixar(nomeArquivo, conteudo, mime) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
