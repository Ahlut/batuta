# ADOPTION.md — decisões por projecto

Este ficheiro é a versão longa do passo 3 do `README.md`. Cada secção é uma
pergunta que o `CLAUDE.template.md` deixa em aberto de propósito — responder
antes de considerar a adopção terminada.

---

## 1. Que tiers se aplicam

A tabela de 8 tiers do template assume um projecto com base de dados
própria, regras de autorização por linha (tipo RLS) e operações financeiras.
Nem todo o projecto tem as três coisas.

| Tier | Mantém-se sempre? | Quando reduzir/fundir |
|------|---|---|
| NON-CODE | Sim — não invoca agentes em nenhum projecto | — |
| DISPLAY | Sim | — |
| DEPS | Sim, se o projecto tiver gestor de dependências com lockfile | Fundir com LOGIC se não houver gate de cooldown nem processo de bump distinto |
| LOGIC | Sim | — |
| SECURITY | Sim, se houver qualquer noção de autorização/auth | Se o projecto for uma lib sem auth, este tier pode nunca disparar — mantê-lo na tabela na mesma, para o dia em que dispare |
| DATA-MIGRATION | Só se houver dados em produção que se possam corromper | Fundir com SCHEMA se o projecto ainda não tiver dados reais |
| SCHEMA | Só se houver schema (base de dados, contrato de API versionado) | Renomear para o que fizer sentido (ex.: "CONTRACT" para uma API pública) |
| FEATURE | Sim — é o tier que dispara o fan-out completo | — |

A pergunta a fazer por tier, não a resposta: **qual é o pior erro possível
neste tipo de mudança, e o processo proposto é proporcional a esse erro?**
Um projecto sem dinheiro nem dados pessoais pode razoavelmente correr LOGIC e
FEATURE sem Security a full — mas declarar isso explicitamente no
`CLAUDE.md` adaptado, não deixar a tabela genérica a mentir sobre o que
realmente corre.

## 2. Que agentes fazem sentido

Os 6 agentes do template (Architect, Security, QA, Product, Frontend,
Backend) vieram de um projecto full-stack com frontend + backend + base de
dados próprios. Perguntas por projecto:

- **Frontend/Backend como agentes verticais separados só fazem sentido se
  o projecto tiver essa separação real.** Uma CLI, uma lib, um pipeline de
  dados não têm "frontend" — nesse caso, ou se renomeia o vertical para a
  camada real (ex.: "CLI agent", "pipeline agent"), ou se funde num único
  agente de implementação.
- **Product só se paga quando há ambiguidade de UX real e frequente.** Um
  projecto interno de ferramentas sem utilizadores externos pode nunca
  precisar deste agente — não o forçar a existir só porque o template o
  tem.
- **Architect e Security são os dois que menos se cortam.** Mesmo em
  projectos pequenos, a decisão de desenho antes de escrever e a revisão
  antes de mergear pagam-se cedo — são os candidatos a manter mesmo quando
  se reduz o resto.

**Onde vive o contexto dos agentes.** Os ficheiros de `agents/` são
genéricos por desenho e cada agente começa por ler o `CLAUDE.md` do projecto
— é lá que se investe a especificidade, não nos ficheiros de agente (que na
via plugin são read-only e partilhados). O nível de detalhe que vale a pena
ter no `CLAUDE.md` para alimentar, por exemplo, o Security agent (exemplo
fictício):

- Auth: NextAuth (JWT) — sessão em cookie httpOnly
- Autorização: middleware por role + checks por linha na camada de dados —
  primeira linha de defesa
- Roles: admin, gestor de equipa, utilizador final — regras de acesso
  específicas por role
- Rotas server-only: usam a chave de serviço (nunca exposta ao cliente)
- Operações críticas: transacções atómicas com SELECT ... FOR UPDATE

Menos específico do que isto e o agente revê às cegas; a instrução dele
nesse caso é apontar a lacuna, não fingir que revê.

## 3. Que gates de CI

O `ci.yml` de um projecto real com deploy automático (não incluído neste
template — cada projecto está amarrado ao seu próprio provedor de deploy e à
sua própria BD-as-a-service) tende a ter esta forma, que generaliza bem:

```
job "ci":     gate de dependências (se existir) → install → audit de
              vulnerabilidades → lint → test → typecheck → build → budget
              de tamanho de bundle (se aplicável)
job "e2e":    depende de "ci", mas o deploy NÃO depende de "e2e" — decisão
              explícita, documentada, revista quando o e2e amadurecer
job "deploy": depende só de "ci"
```

Decisões por projecto, a fazer conscientemente e documentar no `CLAUDE.md`
adaptado (secção "O que realmente bloqueia"):

- **O typecheck é gate ou disciplina manual?** No projecto de origem foi
  disciplina manual durante meses — e isso escondeu bugs reais antes de
  passar a gate. Decidir cedo, não por omissão.
- **O E2E bloqueia o deploy?** Se não bloquear, dizer isso explicitamente
  em vez de deixar a suposição implícita de que "verde = seguro para
  produção".
- **Há revisão humana obrigatória (PR + code owners) ou é push directo
  para a branch principal?** Regras como "CODEOWNERS só actua em PRs" são
  inúteis se o fluxo real for push directo — não documentar uma proteção
  que não dispara.

## 4. Onde vive a lista-única de pendentes

O padrão que vale a pena copiar: um único ficheiro/board como "a única lista
que conta" — tudo o que está aberto (achados, decisões pendentes,
follow-ups) entra ali, e só ali, no momento em que é descoberto. A
alternativa a evitar é ter 3-4 sítios diferentes (comentários no código,
issues, um doc de notas, a memória do próprio Claude) que divergem em
silêncio.

Decidir por projecto:
- **Onde vive?** Um ficheiro Markdown no repo (simples, versionado, lido
  pelo Claude); um board externo (Linear/Jira, mais visível para uma equipa
  maior); uma issue fixada.
- **Quem escreve nela?** Se for um ficheiro no repo, o próprio Claude
  escreve-lhe directamente no momento em que descobre um follow-up — não
  "lembra-se" para mais tarde.
- **Apontar para ela no `CLAUDE.md` adaptado**, na tabela de "Documentação
  de referência", com a frase "a única lista que conta" ou equivalente —
  é essa frase que evita a redescoberta do mesmo item por sessões
  diferentes.

## 5. Onde vive a fonte de verdade visual

O mesmo problema que a §4 resolve para os pendentes, aplicado ao design:
sem um sítio declarado, tokens, paleta, tipografia e regras de componente
dispersam-se por três ou quatro lados e divergem em silêncio. E sem esse
ponteiro, o Frontend agent está na mesma posição em que o Security estaria
sem o modelo de autorização declarado — a rever às cegas.

Decidir por projecto (as perguntas, não as respostas):

- **Onde vive a fonte de verdade visual?** Um doc no repo (ex.:
  `docs/design-system.md`), um export de tokens de uma ferramenta de design,
  uma skill de design instalada — ou nada de formal.
- **Quem a pode alterar, e o que acontece quando o código e ela divergem?**
  (qual dos dois é que se corrige?)
- **Apontar para ela na tabela "Documentação de referência" do `CLAUDE.md`**
  adaptado — é de lá que o Frontend agent a vai ler.
- **Se o projecto não tiver nenhuma, dizê-lo explicitamente** no `CLAUDE.md`
  em vez de deixar o agente a assumir uma que não existe.

Deliberadamente agnóstico: nenhuma ferramenta nomeada. Cada projecto aponta
para o que tiver.

## 6. O manual de orquestração (opcional, tardio)

O projecto de origem desta framework tem um segundo documento, à parte do
`CLAUDE.md`, com os rituais específicos do papel de orquestrador naquele
projecto (ambientes de trabalho isolados por bloco, ferramentas próprias de
ensaio de mudanças de schema, convenções da máquina local). Não veio para
este template porque **é demasiado cedo** — esses rituais só se escrevem
depois de existirem, isto é, depois de o projecto já ter passado por
incidentes e sessões suficientes para haver um padrão a documentar.

Quando o projecto novo atingir esse ponto (tipicamente: já há um padrão
repetido 2-3 vezes que vale a pena não reinventar a cada sessão), criar o
equivalente e apontar para ele a partir do `CLAUDE.md`, tal como projectos
maduros costumam fazer. Escrevê-lo cedo demais produz um documento que
descreve rituais hipotéticos, não reais — e isso não se distingue de ficção
até alguém tentar segui-lo.

## 7. Gate de cooldown de dependências (supply-chain)

Ver `hooks/README.md` — decisão explicada ali. Resumo: opcional, específico
de ecossistema, só compensa quando o projecto já tem CI a sério.

## 8. Checklist final antes de considerar a adopção terminada

- [ ] `CLAUDE.md` do projecto sem nenhum `{{PLACEHOLDER}}` por preencher
- [ ] Todas as secções `<!-- ADAPTAR -->` foram lidas e resolvidas (adaptadas
      ou removidas explicitamente — não deixadas como estavam)
- [ ] A tabela de tiers reflecte o que o projecto realmente tem (secção 1)
- [ ] Os agentes existentes fazem sentido para a stack real (secção 2)
- [ ] O hook de pre-push está instalado e a correr comandos reais (`npm
      install` imprime a confirmação)
- [ ] A lista-única de pendentes existe e está referenciada no `CLAUDE.md`
      (secção 4)
- [ ] A fonte de verdade visual está declarada no `CLAUDE.md` — ou a sua
      ausência está explícita (secção 5)
- [ ] `docs/security-checklist.md` e `docs/test-conventions.md` foram
      criados (mesmo que curtos) — o `CLAUDE.md` aponta para eles mas não
      os substitui
