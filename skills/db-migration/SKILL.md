---
name: db-migration
description: Cria, valida e documenta uma migração de schema — escreve o ficheiro na pasta de migrações, produz o script de rollback e regista a migração no doc de estado de migrações. Usar em tier SCHEMA ou DATA-MIGRATION.
---

Cria, valida e documenta uma migracao de schema.

## Argumentos
- `$ARGUMENTS` — descricao da migracao (ex: "adicionar tabela de invoices")

## Workflow

1. **Analisar**: perceber o que precisa de mudar no schema
2. **Verificar estado atual**: ler os tipos/schema gerados (se existirem)
   para entender o schema existente — nao assumir
3. **Criar migracao**: gerar o ficheiro na pasta de migracoes do projecto,
   com timestamp/versao segundo a convencao usada
4. **Incluir sempre**:
   - Autorizacao activa (RLS ou equivalente) para tabelas novas
   - Regras de autorizacao para cada role/perfil relevante
   - Constraints para campos criticos (financeiros, obrigatorios)
   - Indices para campos usados em queries frequentes
   - Comentarios explicativos no SQL/DDL
5. **Rollback**: criar script de rollback correspondente
6. **Actualizar tipos**: regenerar os tipos gerados da base de dados, se o
   projecto os tiver. Nao e opcional — uma tabela aplicada mas nao
   regenerada nos tipos falha na primeira query que a usa.
7. **Registar**: acrescentar linha no doc de estado de migracoes
   (`docs/migrations-state.md` ou equivalente) com estado `por aplicar`

## Validacoes obrigatorias
- [ ] Autorizacao activa na tabela
- [ ] Regras para todos os roles/perfis relevantes
- [ ] Sem `CASCADE` em deletes de producao sem decisao explicita (preferir soft delete)
- [ ] Constraints para campos financeiros (>= 0, NOT NULL conforme aplicavel)
- [ ] Indices para foreign keys e campos de pesquisa

## Como aplicar <!-- ADAPTAR: descrever o mecanismo real do projecto -->

Se o projecto nao tiver deploy automatico de schema, aplicar manualmente e
registar a evidencia (output, data) no doc de estado de migracoes. **O passo
que mais se esquece e o registo depois de aplicar** — sem ele, ninguem sabe
o que esta realmente em producao vs. so no repositorio.

⚠️ Se o motor de base de dados corre o script inteiro como uma transaccao,
uma falha a meio faz rollback de tudo o que veio antes, mesmo parecendo ter
corrido. Antes de criar regras de autorizacao novas, remover/substituir
explicitamente qualquer versao anterior com o mesmo nome (evita "already
exists" a abortar a transaccao inteira).
