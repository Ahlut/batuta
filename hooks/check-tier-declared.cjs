#!/usr/bin/env node
// Hook PreToolUse (Claude Code) — o gate do passo 0 do fluxo, imposto pelo
// harness em vez de só pedido em prosa.
//
// Bloqueia Edit/Write em ficheiros de código se não existir uma declaração
// "TIER: ..." no transcript da sessão desde o último commit (o commit fecha
// o bloco de trabalho anterior; um bloco novo exige declaração nova).
//
// Extensão .cjs de propósito: num projeto com "type": "module" no
// package.json, um .js seria tratado como ESM e o `require` crashava — e
// num PreToolUse, exit != 2 NÃO bloqueia, ou seja, o gate morria aberto.
//
// Limites, declarados honestamente:
// - O modelo pode passar a declarar o tier por reflexo para desbloquear a
//   edição. O valor do gate não é impedir isso — é tornar a declaração
//   VISÍVEL ao utilizador em todos os blocos, para o push-back humano
//   acontecer. Prosa ignorada era invisível; uma declaração reflexa não é.
// - O matcher é Edit|Write: escrever um ficheiro por redirecção de shell
//   (Bash) passa ao lado do gate. Buraco conhecido e aceite — pôr Bash no
//   matcher geraria um falso positivo em cada comando.
// - Só o TAIL do transcript (últimos 256KB) é lido, por custo: este hook
//   corre em CADA Edit/Write e transcripts longos chegam a megabytes. Uma
//   declaração há mais de 256KB de transcript SEM commit pelo meio não é
//   encontrada — na prática não acontece (o passo 8 do fluxo comita por
//   bloco), e o falso bloqueio resolve-se redeclarando o tier.
// - Fail-open em erros de infraestrutura (sem transcript, JSON ilegível):
//   um gate de processo não deve brickar a edição num ambiente inesperado.
//   Fail-closed apenas no caso que ele existe para apanhar: transcript
//   legível e sem declaração.
//
// Instalação: ver hooks/README.md. Isenções: .md/.txt, docs/ e .claude/ —
// o passo 0 aplica-se a código. .json NÃO é isento de propósito: mexer no
// package.json é tier DEPS (ou LOGIC), não documentação.

'use strict';

const fs = require('fs');
const { execSync } = require('child_process');

const TIER_RE = /TIER:\s*(NON-CODE|DISPLAY|DEPS|LOGIC|SECURITY|DATA-MIGRATION|SCHEMA|FEATURE)/i;
const EXEMPT_RE = /\.(md|txt)$|(^|[\\/])docs[\\/]|(^|[\\/])\.claude[\\/]|(^|[\\/])scratchpad[\\/]/i;
const TAIL_BYTES = 256 * 1024;

function readTail(path, maxBytes) {
  const fd = fs.openSync(path, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    const start = Math.max(0, size - maxBytes);
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    let text = buf.toString('utf8');
    if (start > 0) {
      // descarta a primeira linha, potencialmente cortada a meio
      const nl = text.indexOf('\n');
      text = nl === -1 ? '' : text.slice(nl + 1);
    }
    return text;
  } finally {
    fs.closeSync(fd);
  }
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

  let transcript;
  try {
    transcript = readTail(input.transcript_path, TAIL_BYTES);
  } catch {
    process.exit(0);
  }

  // Fronteira do bloco de trabalho: o último commit. Repo sem commits (ou
  // sem git) => qualquer declaração na sessão conta.
  let lastCommitTs = 0;
  try {
    const iso = execSync('git log -1 --format=%cI', {
      cwd: input.cwd || process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    lastCommitTs = Date.parse(iso) || 0;
  } catch {
    lastCommitTs = 0;
  }

  const declared = transcript.split('\n').some((line) => {
    if (!line.includes('TIER:')) return false;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      return false;
    }
    if (entry.type !== 'assistant' && entry.type !== 'user') return false;
    const ts = Date.parse(entry.timestamp || '') || 0;
    if (ts < lastCommitTs) return false;
    const content = JSON.stringify((entry.message && entry.message.content) || '');
    return TIER_RE.test(content);
  });

  if (declared) process.exit(0);

  process.stderr.write(
    'Gate de tier (passo 0 do fluxo): nao ha declaracao "TIER: X. Agentes: Y. ' +
      'Local test: sim/nao." neste bloco de trabalho (desde o ultimo commit). ' +
      'Declara o tier ao utilizador ANTES de editar codigo — ver a tabela de ' +
      'tiers no CLAUDE.md.'
  );
  process.exit(2);
});
