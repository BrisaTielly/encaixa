# Encaixa

Um planejador de graduação que usa algoritmo genético para distribuir as disciplinas restantes entre os próximos semestres.

O estudante marca o que já concluiu, define a carga máxima desejada e inicia a otimização. O resultado mostra uma rota possível até a formatura, a carga de cada semestre e eventuais conflitos encontrados.

## Como funciona

Cada indivíduo da população possui:

- uma ordem de prioridade para as disciplinas pendentes;
- uma carga horária alvo por semestre.

Essa representação é convertida em um plano respeitando, quando possível:

- pré-requisitos e co-requisitos;
- carga horária máxima;
- semestre de oferta;
- percentual mínimo do curso para estágio e TCC;
- equilíbrio da carga entre os semestres.

A população evolui por seleção em torneio, crossover de ordem, mutação e elitismo. Como o algoritmo é estocástico, execuções diferentes podem produzir planos diferentes.

## Tecnologias

- React
- TypeScript
- Vite
- Vitest
- CSS

## Executando localmente

```bash
pnpm install
pnpm dev
```

Para verificar e gerar a versão de produção:

```bash
pnpm test
pnpm build
```

## Limitações

Este é um protótipo acadêmico, não uma ferramenta oficial de matrícula.

- A oferta das disciplinas é aproximada pela paridade do período.
- Horários, vagas, turmas e escolha de optativas não são considerados.
- O algoritmo não garante que encontrou a solução ótima global.
- A grade curricular precisa ser conferida com a versão oficial da instituição.

Antes de tomar qualquer decisão acadêmica, confirme o planejamento com a coordenação do curso.

## Deploy

O projeto pode ser importado diretamente na Vercel usando o preset do Vite. O comando de build é `pnpm build` e a pasta de saída é `dist`.

## Licença

Distribuído sob a licença MIT.
