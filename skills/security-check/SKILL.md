---
name: security-check
description: Análise de segurança das mudanças recentes — corre o agente Security sobre o git diff da área modificada. Usar depois de implementar em tier SECURITY, DATA-MIGRATION, SCHEMA ou FEATURE, antes do commit.
---

Analisa a seguranca da area de codigo modificada recentemente.

## Workflow

1. **Identificar scope**: verifica `git diff` para perceber que ficheiros mudaram
2. **Analisar**: invoca o agente Security (`.claude/agents/security.md`) para analise completa
3. **Checklist**: verifica todos os items em `docs/security-checklist.md`
4. **Backend**: se envolve tabelas/regras de autorizacao/funcoes privilegiadas,
   invoca o agente Backend (`.claude/agents/backend.md`) para validar
5. **Dependencias**: se foram adicionadas ou actualizadas deps, corre o audit
   de vulnerabilidades do gestor de pacotes do projecto
6. **Corrigir**: se encontrar issues CRITICA ou ALTA, corrige imediatamente
7. **Reportar**: produz relatorio com formato abaixo

## Output

```
## Analise de Seguranca — [area analisada]

### Issues encontradas
[CRITICA/ALTA/MEDIA/BAIXA] — Descricao
- Ficheiro: path/to/file:linha
- Risco: o que pode acontecer
- Correcao: como resolver (ou ja corrigido)

### Verificacoes OK
- Lista do que esta correto

### Recomendacoes
- Melhorias opcionais
```
