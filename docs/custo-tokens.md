# Custo de tokens da orquestração — regras de contenção

_Origem: escrito num produto SaaS real em produção, depois de uma feature
multi-sprint esgotar sozinha um limite de sessão de 5h — 100% do uso veio de sessões
"subagent-heavy", 88% acima de 150k de contexto. A framework de tiers manda
fazer fan-out de agentes, e isso é caro; a conclusão não foi abandonar o
fan-out (apanhou bugs reais de segurança e de dados), foi escalá-lo ao risco
real de cada mudança em vez de aplicar sempre o máximo. Regras abaixo tal
como validadas nesse projecto — são agnósticas de stack._

## Regras de contenção (overlay ao sistema de tiers)

**R1 — Reconhecimento: 1 agente, não vários.** Um único agente de
exploração por feature com âmbito largo, em vez de vários em paralelo mais
um agente de planeamento. Um agente de planeamento dedicado só quando o
desenho é genuinamente incerto; senão o orquestrador desenha inline a partir
do reconhecimento.

**R2 — Modelo por custo, a sério.** O modelo caro (ex.: Opus) só para
Architect e Security (decisão crítica). Reconhecimento e QA podem correr no
modelo intermédio (Sonnet) — ou no mais barato (Haiku) para reconhecimento
puramente mecânico. **Menos agentes** é ainda mais importante que **agentes
mais baratos**.

**R3 — Verificar UMA vez.** Ou o agente corre a suite e o orquestrador
confia no número (spot-check dirigido), ou o orquestrador corre uma vez —
nunca as duas. Preferir correr testes DIRIGIDOS (só o ficheiro relevante)
nos agentes, e a suite inteira só no portão final antes do push.

**R4 — Higiene de contexto entre blocos de trabalho.** Compactar ou limpar
o contexto entre sub-partes sequenciais de uma feature grande. O
orquestrador guarda a CONCLUSÃO ("bloco X verde, mergeado"), não o relatório
inteiro de cada agente.

**R5 — Lane leve por tier + tamanho da mudança.** Nem toda a mudança precisa
da coreografia completa:
- **LOGIC / lógica isolada**: sem Architect. Uma spec curta inline + 1
  agente de implementação + QA. Security-pós inline se o diff for pequeno.
- **Migração aditiva** (ex.: 1 coluna + constraints): Security **inline**
  pelo orquestrador (que já conhece os padrões) em vez de um agente
  dedicado; migração escrita inline; 1 agente só para a UI/consumidor.
- **FEATURE real multi-camada com superfície de ataque** (schema + regras de
  autorizacao + endpoint privilegiado): aí sim, Architect + Security-pré +
  Security-pós completos. É onde o fan-out se paga.
- Regra de ouro: **o fan-out escala com o risco, não com o hábito.**

**R6 — Não paralelizar frentes que competem pelo mesmo teto.** Correr várias
frentes caras (implementação + QA + Architect de outra sub-parte + Security
de outra ainda) ao mesmo tempo esgota a sessão mais depressa do que
serializar. Serializar dá também tempo ao humano de testar o que já saiu, e
espalha o custo no tempo em vez de o concentrar.

**R7 — Um único agente por frente, retomado (não re-lançado do zero), quando
ele para a meio** — evita reprocessar o contexto inteiro outra vez.

## O que NÃO mudar

O fan-out completo em tiers de risco alto (SECURITY/SCHEMA/FEATURE com
escrita nova, regras de autorizacao, privilégios elevados, dinheiro). A
contenção é sobre **não gastar coreografia de FEATURE numa mudança de
LOGIC**, não sobre cortar a revisão onde ela importa — a revisão adversarial
paga-se precisamente nesses casos.

---
_Referência cruzada: `CLAUDE.md` (tabela de tiers), `ADOPTION.md` (o que
decidir por projecto)._
