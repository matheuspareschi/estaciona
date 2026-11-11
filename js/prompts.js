// Variações da pergunta do topo do Início.

export const PERGUNTAS = [
  "O que deixamos aqui?",
  "O que fica por aqui?",
  "O que vamos guardar?",
  "O que ficou desta tarefa?",
  "O que deixamos para trás?",
];

/** Sorteia uma pergunta diferente da anterior. `rng` é injetável para teste. */
export function sortear(anterior, rng = Math.random) {
  const candidatas = PERGUNTAS.filter((p) => p !== anterior);
  const i = Math.min(Math.floor(rng() * candidatas.length), candidatas.length - 1);
  return candidatas[i];
}
