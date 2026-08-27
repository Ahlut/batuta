# CLAUDE.md — {{PROJECT_NAME}}

Le este ficheiro no inicio de cada sessao. E o indice do projeto — aponta
para os docs detalhados em vez de duplicar informacao.

> **Placeholders a preencher antes de usar este ficheiro** (procurar e
> substituir todos):
> `{{PROJECT_NAME}}` · `{{PRODUCT_SUMMARY}}` · `{{ROLES}}` · `{{ROUTES}}` ·
> `{{STACK}}` · `{{CODE_CONVENTIONS}}` · `{{TEST_STACK}}` ·
> `{{LINT_CMD}}` · `{{TEST_CMD}}` · `{{TYPECHECK_CMD}}` · `{{BUILD_CMD}}` ·
> `{{DEV_CMD}}` · `{{BACKLOG_DOC}}` (a lista-única de pendentes do projecto).
> Secções marcadas `<!-- ADAPTAR -->` pedem uma decisão, nao so um
> preenchimento de texto — ler a nota antes de apagar ou manter.

---

## O Produto

{{PRODUCT_SUMMARY}}
Contexto completo: `docs/product-context.md` <!-- ADAPTAR: criar se nao existir; e o doc de produto/dominio, nao de processo -->

**Roles**: {{ROLES}} <!-- ADAPTAR: apagar esta linha e "Rotas" se o projecto nao tiver roles distintos -->
**Rotas**: {{ROUTES}}

---

## Stack

{{STACK}}

<!--
Exemplo ficticio (comentado como referencia de nivel de detalhe, nao como default):
- Next.js (App Router) + TypeScript
- Radix UI + CSS Modules
- SWR para data fetching
- Prisma + PostgreSQL
- NextAuth (JWT em cookie httpOnly)
- Jest + Testing Library (testes unitarios)
-->

---

## Convencoes de codigo

{{CODE_CONVENTIONS}}

<!--
Categorias que valeu a pena separar no projecto de origem — adaptar, nao copiar:
- Ficheiros e pastas (convencao de nomes, onde vive cada tipo de ficheiro)
- Tipagem (ex.: "sem `any`", tipos de DB gerados vs escritos a mao)
- Padroes da framework de UI (ex.: "logica em hooks, nao inline")
- Padroes de data layer (ex.: "sempre .select() explicito, nunca select('*')")
- Operacoes criticas (financeiras, irreversiveis) -> camada atomica no backend
- UI primitivos de terceiros: nunca editar directamente; se uma excepcao for
  necessaria, registar onde e porque (ficheiro + secçao + justificaçao), para
  nao se repetir "sem querer" numa sessao futura.
-->

---

## Seguranca

Checklist completa: `docs/security-checklist.md`

Resumo: <!-- ADAPTAR: 1-3 linhas com os invariantes de seguranca do projecto
(ex.: "RLS em tudo", "validacao frontend + backend", "sem segredos em vars
publicas", "operacoes financeiras atomicas") -->

Supply-chain (opcional — ver `ADOPTION.md` §6): se o projecto tiver um gate
de cooldown de dependencias, descrever aqui a regra e apontar para o script.

---

## Testes

Convencoes completas: `docs/test-conventions.md`

Resumo: {{TEST_STACK}}. Hook pre-push corre `{{LINT_CMD}}` + `{{TEST_CMD}}`
automaticamente antes de cada push.

---

## Areas duplicadas do projecto <!-- ADAPTAR -->

Se o projecto tiver superficies quase-duplicadas (paginas por role, temas,
clientes multiplos de uma mesma API) em vez de componentes/modulos
partilhados, documentar aqui o mapa completo — nao uma amostra. A licao do
projecto de origem: uma tabela com metade das linhas perde exactamente os
casos onde os bugs aparecem, porque ninguem sabe que aquele espelho existe
ate o esquecer.

| Area | Espelho A | Espelho B | Espelho C |
|------|-----------|-----------|-----------|
| _(preencher, ou apagar a seccao se nao houver duplicacao)_ | | | |

Se nao houver duplicacao estrutural no projecto, apagar esta seccao — nao
manter vazia como placeholder permanente.

Padrao a seguir quando a duplicacao existir: um componente/modulo unico
montado nos espelhos, com a diferenca entre eles absorvida numa prop/parametro
em vez de um `if (contexto === ...)` espalhado. Dedup incremental, nao
reescrita completa de uma vez.

---

## Fluxo de desenvolvimento

O principio base: **proporcionalidade ao risco**. Processo leve onde o custo
de um erro e baixo; processo rigoroso onde o custo e alto. O pre-push hook
(`{{LINT_CMD}}` + `{{TEST_CMD}}`) e a rede de seguranca base — corre sempre
antes de qualquer push, independentemente do resto.

```
0. Antes de qualquer Edit/Write em codigo que vai para git, declarar ao utilizador:
   "TIER: X. Agentes: Y. Local test: sim/nao."
   Esta linha e o gate — sem ela, nao escrever codigo. Aplica-se a CADA bloco
   de mudancas (nao uma vez por sessao). O utilizador pode fazer push-back
   imediato se o tier estiver errado.
   Este passo e IMPOSTO pelo harness, nao so pedido: o hook PreToolUse
   `check-tier-declared` (ver "Hooks automaticos") bloqueia Edit/Write em
   ficheiros de codigo se nao houver declaracao TIER desde o ultimo commit.
1. Perceber o pedido -> confirmar se ambiguo
2. Ler codigo existente antes de escrever (nunca assumir)
   2a. <!-- ADAPTAR: regra "nunca inventar acesso a superficie gerida por
       terceiros" — ex.: antes de escrever queries que tocam tabelas geridas
       pelo provider de auth, grep no directorio de migracoes por padrao
       similar; nunca inventar um acesso directo a uma tabela de sistema
       desse provider. Trocar pelo equivalente do stack real. -->
2.5 Se tier SECURITY/SCHEMA e ha um erro reportado: capturar o codigo/mensagem
    exactos ANTES de patchar (substituir toast/log generico por erro completo,
    reproduzir, copiar output) — evita patch para hipotese errada
3. Classificar o tier (ver tabela abaixo)
4. Se tier SCHEMA ou FEATURE -> correr Architect (ver mecanismo abaixo)
5. Implementar
5.5 Se a mudanca toca um ficheiro do mapa de areas duplicadas: verificar
    TODOS os espelhos da linha antes do commit - a mudanca aplica-se la? Se
    sim, aplicar; se nao, declarar explicitamente porque no resumo.
    (Apagar este passo se a seccao "Areas duplicadas" nao existir no projecto.)
6. Se tier LOGIC, SECURITY, DATA-MIGRATION, SCHEMA ou FEATURE -> correr QA
   (escrever testes)
6.5 Para tiers LOGIC+ que alteram UI ou fluxo de utilizador: verificacao de
    comportamento antes do commit - correr a app (`{{DEV_CMD}}`) e percorrer
    o fluxo alterado. Testes unitarios nao substituem este passo. Ambito
    deliberadamente leve: so o fluxo alterado, nao regressao completa.
    ("Local test: sim/nao" no preambulo TIER passa a significar isto
    explicitamente.)
7. Se tier SECURITY, DATA-MIGRATION, SCHEMA ou FEATURE -> correr Security
   (ver mecanismo abaixo)
8. Commit -> rapido (sem hook). Antes de git commit, reler o preambulo TIER
   declarado no passo 0 deste bloco — os agentes prometidos correram? Se nao,
   parar e correr agora.
   Correr `{{TYPECHECK_CMD}}` se o projecto for tipado. Exigir **zero** — erro
   novo e regressao a corrigir, NUNCA a mascarar com casts/any/ts-ignore.
   <!-- ADAPTAR: declarar aqui se o typecheck e ou nao gate automatico (pre-push/CI).
   Se nao for, dizer explicitamente que e disciplina manual — nao presumir. -->
9. Push -> pre-push corre `{{LINT_CMD}}` + `{{TEST_CMD}}` automaticamente. Se
   falhar, push e bloqueado.
```

### Tiers de mudanca

| Tier | O que e | Architect | QA | Security | Modelo |
|------|---------|-----------|-----|---------|--------|
| **NON-CODE** | Analise de doc, leitura, plano, brainstorm, perguntas, resumos | — | — | — | — |
| **DISPLAY** | Adicionar campos a queries de leitura, UI copy, estilos, formatacao | — | — | — | — |
| **DEPS** | Bump de dependencia patch/minor que passa o gate de cooldown (se existir) | — | — | — | — |
| **LOGIC** | Nova mutacao, novo componente com estado, novo hook, novo util | — | Sim | — | Sonnet |
| **SECURITY** | Regra de autorizacao (RLS/policy/guard), funcao com privilegios elevados, auth, pagamentos/subscricoes | — | Sim | Sim | Opus + Sonnet |
| **DATA-MIGRATION** | UPDATE/backfill de dados sem alteracao de schema | — | Sim | Sim | Opus + Sonnet |
| **SCHEMA** | Nova tabela, coluna, index, FK, migracao | Sim | Sim | Sim | Opus + Sonnet |
| **FEATURE** | Feature nova que atravessa camadas (schema + autorizacao + UI) | Sim | Sim | Sim | Opus + Sonnet |

_Modelo: Opus → Architect e Security. Sonnet → QA, Frontend, Backend. Usar
sempre alias (`opus`/`sonnet`), nunca IDs fixos de modelo — aliases
acompanham a versao mais recente da familia automaticamente._

<!-- ADAPTAR: se o projecto nao tiver base de dados propria, nao tiver
pagamentos, ou nao tiver conceito de "schema", retirar/fundir os tiers que
nao se aplicam (ver ADOPTION.md §1 para o racional de cada tier). Nao deixar
tiers mortos na tabela so porque vieram do template — cada linha morta e uma
pergunta que alguem vai fazer sem resposta. -->

**Tarefas NON-CODE nao invocam agentes.** Architect/QA/Security existem para
mudancas que vao para git. Analisar um documento, ler codigo, fazer um plano
ou responder a uma pergunta nao precisa de agentes.

**Regra de tie-break:**
- Em duvida entre LOGIC e SECURITY/SCHEMA → subir.
- Em duvida entre DISPLAY e LOGIC → manter LOGIC.
- FEATURE so se a mudanca atravessa REALMENTE schema + autorizacao + UI numa
  so unidade de trabalho.

**Antes de invocar um agente, pergunta-chave:** *Esta mudanca vai para git?*
Se nao → sem agente. Se sim → qual o tier minimo justificavel?

**Tier DEPS — bumps de dependencias.** Um bump de dependencia tem uma cadeia
de seguranca propria e automatica: gate de cooldown (se existir) + audit de
vulnerabilidades + pre-push (lint+test) + build no CI. Para um patch/minor
que passa esse gate, esses controlos SAO o processo de seguranca — nao se
invoca Architect/QA/Security (um Security agent revê diffs de codigo; num
diff de lockfile nao tem nada para analisar). Verificacao obrigatoria: correr
a suite e confirmar que a app arranca. **Escalar para SECURITY** se: bump
**major/breaking**, OU bump de uma lib de **auth/cripto/pagamentos**, OU o
bump exigir furar o cooldown/allowlist — ai o Security agent revê changelog +
breaking changes + transitivos novos.

**"avanca rapido" nao muda o tier.** Muda a velocidade de implementacao, nao
o processo.

**Custo de tokens — overlay de orcamento (obrigatorio ler
`docs/custo-tokens.md`).** O fan-out de agentes deste fluxo e caro quando
usado a full em todas as mudancas. Regras resumidas (R1-R7 completas no
doc): 1 agente de reconhecimento, nao varios em paralelo + Plan; modelo caro
(Opus) SO para Architect/Security; verificar UMA vez (agente OU
orquestrador, nunca os dois); higiene de contexto entre blocos de trabalho
(guardar a conclusao, nao o relatorio inteiro); lane leve para tiers
LOGIC/aditivos; o fan-out COMPLETO reserva-se para FEATURE multi-camada com
superficie de ataque real — escala com o RISCO, nao com o habito.

**Regra anti-skip (aprendida em incidente real):** Em sessoes longas com
muitas fases, a tendencia e tratar os agentes como overhead e "avançar".
Isto e errado. Antes de escrever qualquer codigo de tier >= LOGIC, para e
verifica: *"Ja corri os agentes obrigatorios para este tier?"* Se nao →
corre antes de escrever. Implementar e depois pedir review ao Security nao e
o mesmo que Security antes de implementar — o Security pode encontrar
problemas que mudam o design, nao so o codigo.

---

## Agentes

| Agente | Tipo | Quando invocar | Ficheiro de contexto |
|--------|------|---------------|---------------------|
| Architect | Horizontal | Tier SCHEMA ou FEATURE | `.claude/agents/architect.md` |
| Security | Horizontal | Tier SECURITY, DATA-MIGRATION, SCHEMA ou FEATURE | `.claude/agents/security.md` |
| QA | Horizontal | Tier LOGIC, SECURITY, DATA-MIGRATION, SCHEMA ou FEATURE | `.claude/agents/qa.md` |
| Product | Horizontal | Tier FEATURE — decisoes UX/PM (rotas, fluxos, separacao de conceitos) | `.claude/agents/product.md` |
| Frontend | Vertical | Componentes, paginas, hooks, UX | `.claude/agents/frontend.md` |
| Backend | Vertical | Base de dados, autorizacao, funcoes/servicos de backend | `.claude/agents/backend.md` |

**Horizontais** = transversais, aplicam-se a qualquer area.
**Verticais** = especialistas numa camada tecnica.

Os ficheiros de agente sao **genericos por desenho**: o contexto especifico
do projecto (stack, modelo de auth, principios de UX, arvore de pastas) vive
NESTE ficheiro e nos docs que ele indica — cada agente comeca por le-los. E
por isso que a via plugin (ficheiros read-only partilhados) e a via
copy-paste dao o mesmo resultado; enriquecer um agente = enriquecer o
CLAUDE.md, nao editar o ficheiro do agente.

<!-- ADAPTAR: se o projecto nao tiver frontend/backend como camadas
separadas (ex.: uma CLI, uma lib), reduzir os verticais ao que existir de
facto — nao manter agentes sem area. -->

### Mecanismo de invocacao (OBRIGATORIO seguir)

O harness (Claude Code) carrega os ficheiros de `.claude/agents/*.md`
automaticamente: cada um torna-se um tipo de subagente nomeado, com o papel
definido pelo corpo do ficheiro e o `description` do frontmatter a guiar a
delegacao. Invocar o agente **pelo nome** (`subagent_type: "security"`, etc.)
— NAO copiar o conteudo do ficheiro para o prompt; isso era o mecanismo
antigo e duplica instrucoes que o harness ja aplicou. No prompt da invocacao
vai so o que o ficheiro nao tem: o codigo/contexto da tarefa concreta e o
ambito do que se quer analisado ou produzido.

Confirmar que o tipo aparece na lista de agentes da sessao antes de assumir
que carregou: um frontmatter com YAML invalido — o caso classico e `: `
(dois pontos + espaco) dentro de um `description` sem aspas — faz o agente
ser ignorado EM SILENCIO. Descriptions com `:` vao sempre entre aspas; a
licao custou meses de agentes "instalados" que nunca carregaram no projecto
de origem.

**Modelo por agente**: definido no frontmatter de cada ficheiro (`model:`),
aplicado automaticamente pelo harness (ver coluna "Modelo" na tabela de tiers):
- `model: opus` → Architect, Security, Product (decisoes criticas, analise de seguranca)
- `model: sonnet` → QA, Frontend, Backend (implementacao, testes, codigo mecanico)
- Usar sempre o alias (`opus`, `sonnet`), nunca o ID fixo — o alias
  acompanha automaticamente a versao mais recente da familia.

**Ferramentas por agente**: os revisores nao escrevem. `security` e
`architect` tem `tools: Read, Grep, Glob, Bash` no frontmatter; `product`
tem `Read, Grep, Glob`. Um revisor adversarial que consegue alterar o codigo
que esta a rever deixa de ser adversarial — devolve o achado/spec, e o
orquestrador aplica. (Nota honesta: `Bash` fica, porque a revisao precisa de
`git diff` e de correr verificacoes — o que tecnicamente ainda permite
escrever via shell. A restricao e friccao deliberada e sinal de papel, nao
uma sandbox.) QA, Frontend e Backend mantem escrita — implementar e o papel
deles.

**Thread principal:** modelo mais barato para sessoes exploratórias ou
DISPLAY/LOGIC leve; modelo mais caro quando se implementa directamente nos
tiers SECURITY/SCHEMA/FEATURE sem delegar a agentes.

**Regra critica:** Architect e Security correm ANTES de implementar/commitar.
QA corre DEPOIS de implementar (escreve os testes). Security e QA podem
correr em paralelo quando o codigo ja existe.

**Nao e opcional.** Se o tier exige o agente, o agente tem de correr. Um
plano existente nao substitui o Architect — o plano e o input do Architect,
nao o output.

### Specs persistentes (tier SCHEMA/FEATURE)

Em tiers **SCHEMA/FEATURE**, o output do Architect nao fica so na conversa:
o agente devolve a spec completa (e read-only — ver "Ferramentas por
agente") e o orquestrador escreve-a em `docs/specs/YYYY-MM-DD-<feature>.md`
(decisoes, schema, contratos, criterios de aceitacao) e comita-a **antes**
da implementacao. A
spec e o contrato — a implementacao referencia-a e o QA valida em 2 niveis:
conformidade com a spec primeiro, qualidade do codigo depois (nao so contra o
codigo).

### TDD cirurgico para bugfixes (tier LOGIC+)

Extensao da regra 2.5: para qualquer bug reportado de tier **LOGIC ou
superior**, a reproducao materializa-se num **teste que falha** antes do fix
(quando testavel na suite; senao, documentar a reproducao manual no commit).
O fix so esta completo quando o teste passa. Nao e TDD universal — so
bugfixes, onde o racional local (fixes sem teste de regressao encontrados em
auditoria) justifica o custo.

### Rotinas

Padrao para manutencao recorrente: usar um scheduler/cron do harness para
checks periodicos (deps bloqueadas no cooldown, pulse de seguranca). Manter
minimo — hooks e rotinas so em gates criticos, nao em tudo.

**Checklist de desenho de loops** (aplicar a qualquer automatismo novo —
hook, rotina, cron, workflow autonomo). Antes de o criar, declarar as 4
pecas:

1. **Trigger** — o que dispara (push, cron, evento)
2. **Topologia** — que comando(s)/agente(s) corre e em que ordem
3. **Verificador** — o que valida o resultado (testes, lint, build, agente review)
4. **Stop rule** — quando para (sucesso, N iteracoes, orcamento de tokens)

Sem verificador e stop rule explicitos, o loop nao se cria. Os gates
existentes (pre-push, CI→deploy, rotina do cooldown) ja seguem este padrao.
Loops autonomos que escrevem codigo sem supervisao (estilo "ship while you
sleep") estao fora da framework: conflituam com o gate de tiers, com push
directo para a branch principal e com a disciplina de custo de tokens.

---

## Skills

| Skill | Como usar | O que faz |
|-------|----------|-----------|
| `/security-check` | `/security-check` | Analisa seguranca da area modificada (Security agent + git diff) |
| `/db-migration` | `/db-migration descricao` | Cria e valida migracao de schema, e regista-a no doc de estado de migracoes |

<!-- ADAPTAR: `security-baseline` (auditoria completa do codebase) e
`security-status` (pulse rapido sem agentes) existem no projecto de origem e
seguem o mesmo padrao de frontmatter — replicar quando o projecto crescer o
suficiente para justificar. Nao copiar so porque existiam la; cada skill
nova e mais um ficheiro para manter em sincronia com o fluxo. -->

Skills vivem em `.claude/skills/<nome>/SKILL.md` com frontmatter (`name`,
`description`); agentes em `.claude/agents/<nome>.md`, tambem com
frontmatter incluindo `model`. Confirmar que o harness em uso carrega
skills desta pasta antes de assumir que `/nome` corre alguma coisa — um
ficheiro `.md` solto fora da estrutura esperada nao e descoberto
silenciosamente.

---

## Hooks automaticos

| Hook | Evento | Accao |
|------|--------|-------|
| Pre-push | Antes de `git push` | Corre `{{LINT_CMD}}` + `{{TEST_CMD}}` — bloqueia se falhar |
| check-tier-declared | PreToolUse em Edit\|Write (harness) | Bloqueia edicao de codigo sem declaracao "TIER:" desde o ultimo commit — o passo 0 deixa de ser so prosa |

Config do pre-push: `scripts/pre-push` (instalado via install script — ver
`hooks/README.md` no template). Config do gate de tier:
`.claude/hooks/check-tier-declared.cjs` + entrada PreToolUse em
`.claude/settings.json` (ver `hooks/README.md`). <!-- ADAPTAR: acrescentar
aqui outros hooks do harness que o projecto vier a usar (ex.: SessionStart
informativo) -->

---

## Fluxo de deploy (automatico) <!-- ADAPTAR -->

Descrever aqui, sem overclaim, o que realmente acontece do commit a
producao. O erro mais caro do projecto de origem foi um doc a alegar "3
barreiras" que na pratica eram 2 — declarar sempre **o que bloqueia** e **o
que nao bloqueia**, explicitamente, e corrigir esta seccao no dia em que o
pipeline mudar (nao deixar ficar stale).

```
git commit  →  (instantaneo, sem hook)
git push    →  pre-push hook:   {{LINT_CMD}} + {{TEST_CMD}}
            →  CI:              <!-- descrever os jobs reais -->
```

### O que realmente bloqueia (e o que nao)

**Bloqueia mesmo:** <!-- listar: pre-push, gates de CI que realmente falham o job -->

**NAO bloqueia:** <!-- listar deliberadamente: typecheck se nao for gate,
E2E se o deploy nao depender dele, review de code owners se o fluxo for push
directo sem PR, etc. Uma lista vazia aqui e suspeita — quase nenhum
pipeline bloqueia tudo. -->

### Code review

<!-- ADAPTAR: quando corre o Security agent (durante o desenvolvimento nos
tiers que o exigem) vs. o que a CI cobre automaticamente vs. se ha gate
manual adicional (PR review humano). -->

---

## Documentacao de referencia

| Doc | Conteudo |
|-----|---------|
| `docs/product-context.md` | Produto, dominio, fluxos <!-- ADAPTAR: nome real do doc de dominio --> |
| `{{BACKLOG_DOC}}` | **A única lista que conta** — tudo o que está aberto; item novo entra AQUI |
| `docs/security-checklist.md` | Checklist de seguranca (fonte unica) |
| `docs/test-conventions.md` | Convencoes de teste (fonte unica) |
| `docs/custo-tokens.md` | Regras de contencao de custo de agentes (R1-R7) |

<!-- ADAPTAR: acrescentar aqui outros docs de fonte unica que o projecto for
criando (design system, manual de orquestracao, etc.) — o principio e um
unico doc por topico, CLAUDE.md aponta em vez de duplicar. -->

---

## Variaveis de ambiente

```
<!-- ADAPTAR: listar as vars reais e se sao publicas/secretas -->
```

Ficheiro: `.env.local` (ou equivalente, no .gitignore, nunca commitar)

---

## Comandos uteis

```bash
{{DEV_CMD}}          # servidor de desenvolvimento
{{TEST_CMD}}         # testes
{{LINT_CMD}}         # lint
{{BUILD_CMD}}        # build de producao
{{TYPECHECK_CMD}}    # verificacao de tipos (se aplicavel)
```
