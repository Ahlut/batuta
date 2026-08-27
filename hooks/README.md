# Hooks — instalação

> **Antes de instalar qualquer hook desta pasta, lê o conteúdo dele.** Quem
> clona um projecto que usa a Batuta passa a ter scripts a correr
> automaticamente (no push, ou em cada edição do assistente) sem
> necessariamente ter reparado. São ~25-100 linhas cada — a leitura custa um
> minuto e é a diferença entre adoptar um gate e correr código alheio às cegas.

## Pre-push (núcleo)

`pre-push` corre lint + testes antes de cada `git push` e bloqueia o push se
falharem. É a rede de segurança base do fluxo de 9 passos — corre sempre,
independentemente do tier da mudança.

Nota fail-closed: `npm test` **falha num projecto sem script de teste** (o
default do npm sai com erro) — o que bloqueia o push. É deliberado (um
projecto sem testes não devia ter a rede de segurança em silêncio a fingir
que corre), mas convém saber antes de estranhar: ou se adiciona uma suite,
ou se adapta o comando no `pre-push`.

Instalação (projecto Node/npm):

1. Copiar `pre-push` e `install-hooks.js` para `scripts/` no projecto.
2. Editar `pre-push` — trocar `npm run lint` / `npm test` pelos comandos
   reais do projecto se for outra stack.
3. Adicionar ao `package.json`:
   ```json
   { "scripts": { "prepare": "node scripts/install-hooks.js" } }
   ```
   `prepare` corre automaticamente a seguir a `npm install`, o que copia o
   hook para `.git/hooks/pre-push` em qualquer máquina que clone o
   repositório — não é preciso instalar manualmente.
4. Confirmar: `npm install` deve imprimir
   `install-hooks: installed pre-push`.

Para outro gestor de pacotes/ecossistema, portar a mesma ideia: copiar
`pre-push` para `.git/hooks/pre-push` e marcar executável, disparado a partir
do lifecycle hook equivalente ao `prepare` do npm (ex.: `postinstall` de
outro gestor, ou um `Makefile`/script de setup corrido uma vez).

## check-tier-declared (gate do passo 0, hook do harness)

O passo 0 do fluxo ("declarar TIER antes de escrever código") era prosa — e
prosa ignora-se, como a própria "Regra anti-skip" do CLAUDE.md documenta. O
`check-tier-declared.cjs` torna-o mecânico: é um hook **PreToolUse** do Claude
Code que intercepta Edit/Write e bloqueia a edição de ficheiros de código se
não houver uma declaração `TIER: ...` no transcript da sessão **desde o
último commit** (o commit fecha o bloco de trabalho anterior).

Âmbito e limites (declarados no topo do próprio script):
- Ficheiros `.md`/`.txt`/`.json`, `docs/` e `.claude/` estão isentos — o
  passo 0 aplica-se a código.
- Fail-open em erros de infraestrutura, fail-closed só no caso que ele
  existe para apanhar (transcript legível, sem declaração).
- O que o gate garante não é que o modelo pensa no tier — é que a declaração
  fica **visível ao utilizador** em todos os blocos, para o push-back humano
  acontecer. É fricção deliberada, não uma sandbox.

A extensão `.cjs` não é gosto: com `.js`, qualquer projecto `"type": "module"`
tratava o script como ESM, o `require` crashava, e — como exit ≠ 2 num
PreToolUse não bloqueia — o gate morria ABERTO com stack trace no stderr.
Manter `.cjs` ao copiar.

Instalação manual (sem plugin):

1. Copiar `check-tier-declared.cjs` para `.claude/hooks/` no projecto.
2. Acrescentar ao `.claude/settings.json` do projecto (merge, não substituir):
   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Edit|Write",
           "hooks": [
             { "type": "command", "command": "node .claude/hooks/check-tier-declared.cjs" }
           ]
         }
       ]
     }
   }
   ```

Instalação via plugin: o `hooks/hooks.json` desta pasta é o manifesto de
hooks do plugin da Batuta — instalar o plugin **activa este gate
automaticamente** (o caminho `${CLAUDE_PLUGIN_ROOT}` resolve para a pasta do
plugin instalado). Se não quiseres o gate, usa a adopção manual e não copies
este hook.

Evolução prevista (não implementada): um segundo gate que valide, ao fechar
um bloco, que os agentes obrigatórios do tier declarado correram mesmo.
Exige tracking de estado entre eventos do harness; fica documentado como
próximo passo em vez de meio-feito.

## Gate de cooldown de dependências — opcional, não incluído

Um projecto de origem real tinha um segundo gate,
`scripts/check-dependency-cooldown.mjs`: bloqueia no CI a adopção de
dependências publicadas há menos de 7 dias, como defesa contra ataques de
supply-chain que são detectados e removidos pela comunidade em poucos dias
mas ainda não a tempo de um `npm audit` os apanhar.

**Não veio para este template** porque:
- É específico do registry npm (consulta `registry.npmjs.org` directamente)
  — noutro ecossistema (PyPI, crates.io, RubyGems) a mecânica de consulta de
  timestamp de publicação muda por completo.
- Tem peso próprio (~340 linhas): parsing do lockfile, allowlist com schema
  próprio, guarda fail-closed, retries de rede. Vale a pena escrever de novo
  a pensar no gestor de pacotes real do projecto, não adaptar às pressas.
- Só compensa o custo de manutenção quando o projecto já tem CI a sério e um
  apetite real por essa camada extra de defesa supply-chain — nem todo o
  projecto novo está nesse ponto no dia 1.

Se o projecto adoptar este gate mais tarde, documentar no `CLAUDE.md`
adaptado (secção "Seguranca" → "Supply-chain") a mesma coisa que um projecto
maduro deve documentar: quais as camadas (install local vs. gate de CI vs.
checklist), onde vive a allowlist, e quem a pode editar.
