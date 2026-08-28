#!/usr/bin/env node
// Hook PreToolUse (Claude Code) — o gate do passo 0 do fluxo, imposto pelo
// harness em vez de só pedido em prosa.
//
// Bloqueia Edit/Write em ficheiros de código se não existir um MARCADOR DE
// BLOCO válido: o ficheiro `.claude/tier-block` (gitignored), escrito pelo
// orquestrador ao declarar o tier, com mtime posterior ao último commit
// (o commit fecha o bloco de trabalho anterior; bloco novo = redeclarar e
// reescrever o marcador).
//
// Porquê um marcador e não o transcript: a v1 fazia parse do transcript e
// bloqueava FALSAMENTE em produção — a declaração em prosa ficava atrás de
// um commit intermédio, fora da janela de leitura (256KB ≈ 2-3 min numa
// sessão payload-heavy), ou ainda por flush quando o hook corria. O formato
// do transcript não é contrato; o mtime de um ficheiro é.
//
// Extensão .cjs de propósito: num projeto "type": "module" um .js seria
// ESM e o require crashava — e exit != 2 num PreToolUse NÃO bloqueia, ou
// seja, o gate morria aberto.
//
// Limites, declarados honestamente:
// - O modelo pode escrever o marcador por reflexo. O valor do gate não é
//   impedir isso — o comando (echo > .claude/tier-block) aparece no
//   terminal, VISÍVEL ao utilizador, que faz o push-back. Prosa ignorada
//   era invisível; um echo reflexo não é.
// - O matcher é Edit|Write: escrever ficheiros por redirecção de shell
//   (Bash) passa ao lado do gate. Buraco conhecido e aceite.
// - Blocos com vários commits exigem reescrever o marcador após cada
//   commit — fricção deliberada: cada commit fecha um bloco.
// - Aresta de 1s: o timestamp do commit (git %cI) só tem resolução de
//   segundo — marcador e commit no MESMO segundo comparam com granularidade
//   de 1s. Irrelevante para um gate de fricção; medido nos testes.
// - Fail-open em erros de infraestrutura (stdin ilegível, git indisponível
//   ao datar o commit). Fail-closed no caso-alvo: marcador ausente,
//   inválido ou anterior ao último commit.
//
// Instalação: ver hooks/README.md (na Batuta) / CLAUDE.md (tabela de
// hooks). Isenções: .md/.txt, docs/ e .claude/ — o passo 0 aplica-se a
// código. .json NÃO é isento: package.json é tier DEPS, não documentação.

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TIER_RE = /TIER:\s*(NON-CODE|DISPLAY|DEPS|LOGIC|SECURITY|DATA-MIGRATION|SCHEMA|FEATURE)/i;
const EXEMPT_RE = /\.(md|txt)$|(^|[\\/])docs[\\/]|(^|[\\/])\.claude[\\/]|(^|[\\/])scratchpad[\\/]/i;

function block(reason) {
  process.stderr.write(
    'Gate de tier (passo 0 do fluxo): ' + reason + ' ' +
      'Declara o tier ao utilizador ("TIER: X. Agentes: Y. Local test: sim/nao.") ' +
      'e escreve o marcador de bloco: echo "TIER: X. Agentes: Y. Local test: ..." > .claude/tier-block ' +
      '— ver a tabela de tiers no CLAUDE.md.'
  );
  process.exit(2);
}

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolInput = input.tool_input || {};
  const filePath = toolInput.file_path || toolInput.notebook_path || '';
  if (!filePath || EXEMPT_RE.test(filePath)) process.exit(0);

  const cwd = input.cwd || process.cwd();
  const markerPath = path.join(cwd, '.claude', 'tier-block');

  let st, content;
  try {
    st = fs.statSync(markerPath);
    // strip de NULs: `>` no PowerShell escreve UTF-16LE
    content = fs.readFileSync(markerPath, 'utf8').replace(/\u0000/g, "");
  } catch {
    block('nao ha marcador de bloco (.claude/tier-block).');
    return;
  }

  if (!TIER_RE.test(content)) {
    block('o marcador .claude/tier-block existe mas nao contem uma declaracao "TIER: <tier>" valida.');
    return;
  }

  // Fronteira do bloco: o último commit. Repo sem commits (ou git
  // indisponível) => marcador válido chega.
  let lastCommitTs = 0;
  try {
    const iso = execSync('git log -1 --format=%cI', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    lastCommitTs = Date.parse(iso) || 0;
  } catch {
    lastCommitTs = 0;
  }

  if (st.mtimeMs >= lastCommitTs) process.exit(0);

  block('o marcador .claude/tier-block e anterior ao ultimo commit — o bloco fechou; redeclara o tier deste bloco novo.');
});
