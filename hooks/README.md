# Hooks — instalação

## Pre-push (núcleo)

`pre-push` corre lint + testes antes de cada `git push` e bloqueia o push se
falharem. É a rede de segurança base do fluxo de 9 passos — corre sempre,
independentemente do tier da mudança.

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
