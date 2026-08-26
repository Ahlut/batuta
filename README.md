# Batuta

[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue.svg)](LICENSE)

**A batuta é do orquestrador.** Framework de desenvolvimento AI-first: tu
diriges, os agentes tocam — e o processo escala com o risco, não com o hábito.

Extraída de ~4 meses de uso real no desenvolvimento de um produto SaaS em
produção, e reempacotada para arrancar em qualquer projecto novo. Não é
teoria — é o processo tal como decantou desse uso real, com os incidentes que
o moldaram registados nos docs (de forma anónima) em vez de apagados.

---

## O que é isto

Um conjunto de ficheiros para colar num projecto novo:

- **`CLAUDE.template.md`** — o índice que a Claude lê no início de cada
  sessão: fluxo de desenvolvimento, tabela de tiers, tie-breaks, mecanismo de
  agentes.
- **`agents/`** — 6 definições de agente (papel, contexto, output esperado).
- **`skills/`** — esqueletos de skills que orquestram os agentes.
- **`hooks/`** — hook de pre-push (lint + test) e instalador.
- **`docs/custo-tokens.md`** — regras de contenção de custo de fan-out de
  agentes (agnósticas, copiadas tal como estão).
- **`ADOPTION.md`** — checklist do que decidir por projecto.

## Filosofia

**Proporcionalidade ao risco.** Processo leve onde o custo de um erro é
baixo; processo rigoroso onde o custo é alto. Isto aparece em três sítios:

1. **A tabela de tiers** — 8 níveis, de NON-CODE (não invoca agente nenhum)
   a FEATURE (Architect + Security + QA, obrigatório). Ler/analisar/planear
   nunca dispara agentes; RLS/pagamentos/schema sempre dispara.
2. **O overlay de custo de tokens** (`docs/custo-tokens.md`) — o fan-out
   completo de agentes é caro. A regra não é "menos agentes sempre" — é
   **o fan-out escala com o risco, não com o hábito**. Uma migração aditiva
   de uma coluna não precisa da mesma coreografia que uma feature nova com
   RLS + dinheiro.
3. **O que NÃO se automatiza** — decisões de produto, aplicar SQL em
   produção, loops que escrevem código sem supervisão. Ficam sempre com um
   humano, independentemente do tier.

A framework não existe para adicionar processo — existe para que o processo
que já vale a pena (revisão de segurança antes de RLS, testes antes de
mergear lógica financeira) aconteça sempre, e o resto não aconteça à toa.

### Porque isto não é "3 agentes sempre"

O ficheiro `docs/custo-tokens.md` nasceu de um incidente real: uma feature
esgotou sozinha um limite de sessão de 5h porque o fluxo completo (Architect
→ Security-pré → Frontend → QA → Security-pós) correu 3 vezes seguidas para
3 sub-partes da mesma feature, cada uma a reprocessar contexto grande. A
lição não foi "cortar segurança" — foi escalar a coreografia ao risco real
de cada sub-parte, não ao tier nominal da feature inteira.

---

## Como adoptar — 3 cenários, prompts prontos a copiar

**A. Projecto novo, nascido do zero** — no GitHub, botão **"Use this
template"** sobre este repo cria o repo do projecto já com a Batuta dentro.
Primeira instrução ao Claude:

> Este repo nasceu do template Batuta. Segue o ADOPTION.md e o checklist do
> README: preenche os placeholders do CLAUDE.template.md (renomeia para
> CLAUDE.md), instala o hook de pre-push e pergunta-me só o que não
> conseguires decidir dos ficheiros do projecto.

**B. Projecto novo com scaffolding próprio** (Vite/Next/etc. já criados —
a via recomendada na maioria dos casos; a framework é processo, não código):

> Clona o repositório da Batuta para uma pasta temporária e adopta a
> framework neste projecto seguindo o ADOPTION.md: copia CLAUDE.template.md
> para CLAUDE.md e preenche os placeholders com a stack real deste repo,
> copia agents/ e skills/ para .claude/, liga o pre-push aos comandos de
> lint/test que este projecto já tem.

**C. Projecto existente** — adopção incremental, nada se parte:

> Clona o repositório da Batuta para uma pasta temporária, lê o
> ADOPTION.md e mapeia o que este projecto já tem. Adopta por fases: (1) o
> CLAUDE.md com a tabela de tiers e o fluxo de 9 passos, adaptado às
> convenções que já existem aqui; (2) os agentes; (3) o hook de pre-push.
> Skills e CI ficam para quando doerem. Não reescrevas nada do projecto —
> a framework entra em vigor no próximo commit, não retroactivamente.

**Melhoria contínua:** a Batuta é o upstream. Quando um projecto aprende uma
regra nova, ela sobe aqui; os outros puxam na sessão seguinte.

**Contribuições são bem-vindas** — issues e PRs, sobretudo lições reais
(anonimizadas) que faltam aqui. Ver `CONTRIBUTING.md` para a regra de ouro
antes de propor uma regra nova. Licença: MIT (`LICENSE`).

---

## Checklist de adopção (~30 min)

Checklist rápido — a versão longa com as perguntas por trás de cada passo
está em `ADOPTION.md`.

1. **Copiar ficheiros** (5 min)
   ```bash
   cp CLAUDE.template.md /caminho/do/projecto/CLAUDE.md
   cp -r agents /caminho/do/projecto/.claude/agents
   cp -r skills /caminho/do/projecto/.claude/skills
   cp hooks/pre-push hooks/install-hooks.js /caminho/do/projecto/scripts/
   cp docs/custo-tokens.md /caminho/do/projecto/docs/custo-tokens-e-orquestracao.md
   mkdir -p /caminho/do/projecto/docs/specs
   ```

2. **Preencher os placeholders do `CLAUDE.md`** (10 min) — ver a lista
   completa no topo de `CLAUDE.template.md`. Os principais:
   - `{{PROJECT_NAME}}` — nome do projecto
   - `{{PRODUCT_SUMMARY}}` — uma frase do que o produto faz
   - `{{ROLES}}` / `{{ROUTES}}` — se o projecto tiver roles/rotas distintas
   - `{{STACK}}` — a stack real (linguagem, framework, DB, testes)
   - `{{CODE_CONVENTIONS}}` — convenções de nomes/pastas do projecto
   - Secções `<!-- ADAPTAR -->` — decidir se se aplicam e como

3. **Decidir os tiers aplicáveis** (5 min) — a tabela de 8 tiers do template
   assume schema + RLS + pagamentos. Um projecto sem base de dados própria
   ou sem dinheiro tem menos tiers com peso (ver `ADOPTION.md` §1).

4. **Ligar o hook de pre-push** (5 min)
   ```bash
   # package.json (ou equivalente)
   "scripts": { "prepare": "node scripts/install-hooks.js" }
   ```
   Editar `scripts/pre-push` para os comandos reais de lint/test do
   projecto (o template assume `npm run lint` + `npm test` — trocar se for
   outra stack).

5. **Decidir a lista-única de pendentes** (2 min) — manter um único sítio com
   tudo o que está aberto (achados, decisões pendentes, follow-ups) evita que
   o mesmo item seja redescoberto em sessões diferentes. Escolher um
   equivalente (pode ser um ficheiro, um board, uma issue fixada) e apontar
   para ele no `CLAUDE.md` adaptado.

6. **Gate de cooldown de dependências — opcional** (3 min) — só faz sentido
   se o projecto tiver `npm`/lockfile e apetite para manter
   `scripts/check-dependency-cooldown.mjs` (não incluído neste template —
   é específico o suficiente ao ecossistema de origem que vale a pena
   reescrever a pensar no registry/gestor de pacotes real do novo projecto).
   Ver nota em `hooks/README.md`.

Fim. A partir daqui, o fluxo de 9 passos do `CLAUDE.md` adaptado é o
processo — não há mais setup.

---

## O que NÃO está aqui, e porquê

- **Nenhum código do produto de origem** — nem componentes, nem SQL, nem
  lógica de negócio. Isto é só o esqueleto de processo.
- **`security-baseline` e `security-status`** não vieram como skills
  completas — ficaram fora do lote inicial de 2 (`security-check`,
  `db-migration`) para manter o adopt enxuto; o padrão de frontmatter é o
  mesmo, replicar quando o projecto precisar.
- **Um manual de rituais de orquestração não foi copiado como está** — no
  projecto de origem existia um segundo documento, mais longo, amarrado aos
  rituais específicos daquele projecto (ambientes de trabalho isolados por
  bloco, ferramentas próprias de ensaio de migrações, convenções da máquina
  local). As secções genéricas (o ciclo por bloco de trabalho, "o que não se
  automatiza") foram absorvidas no `CLAUDE.template.md`; o resto fica para
  cada projecto escrever o seu próprio manual de rituais depois de os
  rituais existirem.
- **Nenhum CI/workflow** — o pipeline de CI do projecto de origem está
  amarrado ao seu próprio provedor de deploy e à sua própria BD-as-a-service;
  a ADOPTION.md diz o que um pipeline equivalente deve cobrir, mas escrever o
  YAML fica para o projecto.

---

## Proveniência

Extraída de ~4 meses de uso real no desenvolvimento de um produto SaaS em
produção — não é teoria. Os incidentes citados nos docs são reais, mas
descritos aqui de forma anónima e genérica, sem nome de produto, sem stack
completa atribuída a ele e sem datas de calendário: uma feature que esgotou
sozinha uma sessão de trabalho inteira por excesso de fan-out de agentes; uma
função com privilégios elevados que perdeu uma proteção ao ser recriada por
cópia em vez de editada; uma regra de autorização recursiva que ficou activa
sem se notar durante um bom tempo. Ficaram registados para que o "porquê" de
cada regra sobreviva à cópia, sem expor detalhes do produto de onde vieram.
