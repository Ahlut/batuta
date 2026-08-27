# Contribuir para a Batuta

Obrigado por considerares contribuir. A Batuta é um framework de processo,
não um produto — o valor está nas regras e no "porquê" por trás delas, por
isso o rigor de uma contribuição mede-se mais pela justificação do que pelo
tamanho do diff.

## Princípio da framework

**Proporcionalidade ao risco.** Qualquer proposta que adicione processo tem
de responder: onde é que isto reduz um erro caro, e onde é que isto adiciona
fricção sem correspondência em risco real? Uma regra que se aplica sempre,
independentemente do risco da mudança, é normalmente um sintoma de que
falta uma condição ("só quando X") em vez de faltar a regra em si.

## Como propor uma mudança

1. **Issue primeiro para mudanças estruturais** (novo tier, novo agente, novo
   ficheiro de referência) — para alinhar a forma antes do conteúdo. Para
   correcções pequenas (erro de texto, exemplo em falta, link partido), PR
   directo é suficiente.
2. **PRs pequenos e focados** — uma mudança de processo por PR, não vários
   ajustes não relacionados juntos.
3. **Descrever o "antes"**: que situação real (mesmo que anonimizada) expôs a
   falta desta regra, ou o que corria mal sem ela.

## Regra de ouro para contribuições

**Uma regra nova só entra com o porquê escrito** — idealmente a lição
anónima que a originou, não só a regra em si. `docs/custo-tokens.md` e as
secções "Regras BLOQUEANTES" nos ficheiros de `agents/` seguem este padrão
de propósito: cada linha existe porque alguma coisa correu mal sem ela, e o
texto diz isso, genericamente, em vez de só prescrever o comportamento.

Isto aplica-se com o mesmo peso ao conteúdo de exemplo: se partilhares um
incidente real que motivou uma regra, remove primeiro qualquer coisa que
identifique o produto, a organização ou as pessoas envolvidas (nomes,
datas de calendário, domínios de negócio, identificadores internos). A
lição sobrevive perfeitamente sem esses detalhes — é precisamente esse o
padrão já seguido no resto do repositório.

## O que NÃO é uma boa contribuição aqui

- Regras hipotéticas ("isto podia ser útil um dia") sem um caso real por
  trás — ver `ADOPTION.md` §6 sobre porque é que rituais escritos cedo
  demais não se distinguem de ficção.
- Acoplar a framework a uma stack específica no core (`CLAUDE.template.md`,
  `agents/`, `docs/`) — exemplos concretos de stack são bem-vindos como
  comentários `<!-- ADAPTAR -->`, nunca como default.
- Automação que escreve código sem supervisão humana — está fora de âmbito
  por desenho (ver secção "Rotinas" do `CLAUDE.template.md`).

## Licença

Ao contribuir, aceitas que a tua contribuição seja distribuída sob a mesma
licença MIT do repositório (ver `LICENSE`).
