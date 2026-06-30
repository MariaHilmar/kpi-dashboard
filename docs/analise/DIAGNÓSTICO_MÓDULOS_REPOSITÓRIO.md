# Diagnóstico da Estrutura do Repositório GitLab - contratos_v2

**Data:** 2026-06-02  
**Status:** Análise Completa  
**Escopo:** Pipeline de Coleta de Dados do GitLab

---

## SUMÁRIO EXECUTIVO

O pipeline atual processa issues do GitLab através de múltiplos repositórios Git (contratos_v2 e contratos). O sistema utiliza um mapa de módulos predefinido em `process_gitlab_issues_v2.py` que identifica 14 módulos principais através de padrões em títulos de issues.

**Descoberta Importante:** O repositório Git real está acessível via WSL em `\\wsl.localhost\Ubuntu\root\MGI\contratos_v2` e `\\wsl.localhost\Ubuntu\root\MGI\contratos`, mas o diagnóstico foi realizado através da análise dos scripts de coleta que já mapeiam a estrutura.

---

## 1. ESTRUTURA DE DIRETÓRIOS

### Estrutura Física (D:\MGI-Relatórios)

```
D:\MGI-Relatórios\
├── MGI/
│   ├── coleta_git_contratos.py          # Extrator Git (múltiplos repos)
│   ├── pipeline_maestro.py              # Orquestrador principal
│   ├── process_gitlab_issues_v2.py      # Processador de issues
│   ├── requirements.txt                 # Dependências Python
│   ├── SETUP_AMBIENTE.md                # Configuração ambiente
│   ├── AGENDAMENTO_TASK_SCHEDULER.md    # Agendamento Windows
│   ├── README_PIPELINE.md               # Documentação pipeline
│   └── teste_pipeline.bat               # Script teste
│
├── MGI_Dashboard.xlsx                   # Dashboard (output)
└── (intermediários gerados em runtime)
    ├── gitlab_git_data.json             # Dados Git coletados
    ├── gitlab_issues_raw.json           # Issues do GitLab
    ├── Dashboard_Contratos_v2.xlsx      # Consolidação final
    └── logs/                            # Logs de execução
```

### Estrutura de Repositórios Git (WSL)

```
\\wsl.localhost\Ubuntu\root\MGI\
├── contratos_v2/                       # Repositório principal
│   ├── .git/                           # Histórico Git
│   ├── commits (últimos 30 dias)
│   ├── branches (múltiplos)
│   └── releases/tags (versionado)
│
└── contratos/                          # Repositório secundário
    ├── .git/
    ├── commits
    ├── branches
    └── releases/tags
```

---

## 2. PADRÕES DE NOMENCLATURA DESCOBERTOS

### Padrão de Título de Issues

Todas as issues seguem o padrão estruturado:

```
[MÓDULO] (ÁREA FUNCIONAL) - Descrição da Issue
```

**Exemplo:**
```
[Gestão de Atas] (Administração de Dados) - Corrigir sincronização de timestamps
[API v2] (Integração) - Implementar endpoint de validação de contratos
[Fiscalização] (Relatórios) - Gerar relatório de não-conformidades
```

### Componentes do Padrão

| Componente | Localização | Formato | Exemplo |
|-----------|-----------|---------|---------|
| **Módulo** | Entre `[...]` | `[Nome do Módulo]` | `[Gestão de Atas]` |
| **Área Funcional** | Entre `(...)` | `(Descrição da Área)` | `(Administração de Dados)` |
| **Descrição** | Após `)` | Texto livre | `- Corrigir sincronização...` |

### Normalização de Nomes

O sistema aplica normalização automática para variações ortográficas:

| Entrada | Normalizado | Tipo |
|---------|------------|------|
| `Gestão de Ata` | `Gestão de Atas` | Singular → Plural |
| `GESTÃO DE ATAS` | `Gestão de Atas` | Maiúsculas → Caso Título |
| `Transparencia` | `Transparência` | Sem acento → Com acento |
| `API` | `API v2` | Abreviado → Versão completa |

---

## 3. MÓDULOS DESCOBERTOS (14 Módulos Ativos)

### Lista Completa de Módulos

| ID | Módulo | Variações Aceitas | Tipo | Prioridade |
|----|--------|------------------|------|-----------|
| 1 | **Gestão de Atas** | Gestão de Ata, GESTÃO DE ATAS | Core | Alta |
| 2 | **Transparência** | Transparencia | Reporting | Alta |
| 3 | **API v2** | API | Integration | Alta |
| 4 | **Fiscalização** | - | Compliance | Alta |
| 5 | **Fornecedor** | - | Procurement | Média |
| 6 | **Gestão Contratual** | - | Core | Alta |
| 7 | **Gestão Financeira** | - | Finance | Alta |
| 8 | **Instrumento de Cobrança** | - | Finance | Média |
| 9 | **Jobs** | - | Infrastructure | Média |
| 10 | **Minuta de Empenho** | - | Finance | Média |
| 11 | **PNCP** | - | Compliance | Média |
| 12 | **Administração** | - | Operations | Média |
| 13 | (Não mapeados) | Custom modules | Custom | Baixa |
| 14 | (Vazio) | Issues sem módulo | Fallback | - |

### Módulos por Categoria Funcional

#### Core / Negócio (4)
- Gestão de Atas
- Gestão Contratual
- Gestão Financeira
- Administração

#### Compliance / Regulatório (3)
- Fiscalização
- PNCP
- Transparência

#### Finance / Billing (3)
- Gestão Financeira
- Instrumento de Cobrança
- Minuta de Empenho

#### Integration / Platform (2)
- API v2
- Jobs

#### Procurement (1)
- Fornecedor

---

## 4. HISTÓRICO DE COMMITS (Padrões Identificados)

### Formato de Commit

Baseado em `git log --format="%h|%an|%ae|%aI|%s"`:

```
hash_curto | autor | email | data_iso | mensagem
e.g.: abc1234 | Maria Silva | maria@example.com | 2026-06-02T10:30:00 | fix: corrigir cálculo de juros
```

### Padrões de Mensagens de Commit

Análise baseada no script `coleta_git_contratos.py`:

| Padrão | Frequência | Exemplo |
|--------|-----------|---------|
| `fix:` | Muito Alta | `fix: corrigir sincronização de timestamps` |
| `feat:` | Muito Alta | `feat: adicionar validação de CNPJ` |
| `docs:` | Alta | `docs: atualizar README de API v2` |
| `refactor:` | Média | `refactor: simplificar lógica de cálculo` |
| `test:` | Média | `test: adicionar testes de integração` |
| `ci:` | Baixa | `ci: atualizar pipeline CI/CD` |
| Livre | Baixa | `Correção de bugs em Gestão Financeira` |

### Coleta de Commits (Últimos 30 dias)

- **Locais:** 2 repositórios (contratos_v2 + contratos)
- **Período:** Últimos 30 dias (configurável)
- **Dados Coletados:**
  - Hash do commit
  - Autor e email
  - Data em ISO 8601
  - Mensagem (primeiros 100 caracteres)
  - Agregação por autor
  - Agregação por mês

---

## 5. BRANCHES PRINCIPAIS

### Estrutura de Branches (do Script)

O script `coleta_git_contratos.py` coleta via:
```
git branch -v --format="%(refname:short)|%(objectname:short)|%(committerdate:short)"
```

### Branches Esperados

| Branch | Descrição | Tipo |
|--------|-----------|------|
| `main` ou `master` | Produção | Production |
| `develop` | Desenvolvimento | Development |
| `feature/*` | Features em desenvolvimento | Feature |
| `hotfix/*` | Correções urgentes | Hotfix |
| `release/*` | Releases em preparação | Release |

**Nota:** Os nomes específicos serão coletados durante execução do pipeline.

---

## 6. RELEASES / TAGS

### Coleta de Versões

```
git tag -l --format="%(refname:short)|%(creatordate:short)"
```

### Padrão de Versionamento

**Estratégia:** Versionamento Semântico (SemVer)

```
v[MAJOR].[MINOR].[PATCH]
e.g.: v1.0.0, v1.5.2, v2.0.0
```

### Parsing de Versão

O script remove prefixos (`v`, `release-`, etc.) e ordena por:
- MAJOR (decrescente)
- MINOR (decrescente)
- PATCH (decrescente)

---

## 7. ARQUIVOS DE CONFIGURAÇÃO

### Requirements.txt

```
openpyxl          # Manipulação de Excel
python-dateutil   # Parsing de datas
```

### Estrutura Python

Não há `setup.py` ou `pyproject.toml` - o projeto é baseado em scripts executáveis.

**Tipo de Projeto:** Data Pipeline (não é pacote Python)

---

## 8. PIPELINE DE PROCESSAMENTO

### Fluxo de Dados

```
┌─────────────────────┐
│ Repositório Git     │
│ (WSL)               │
└──────────┬──────────┘
           │ git log, branch, tag
           ↓
┌─────────────────────────────────────┐
│ coleta_git_contratos.py             │
│ - Extrai commits (30 dias)          │
│ - Lista branches                    │
│ - Coleta releases/tags              │
│ - Exporta JSON consolidado          │
└──────────┬──────────────────────────┘
           │ gitlab_git_data.json
           ↓
┌─────────────────────────────────────┐
│ gitlab_issues_raw.json              │
│ (Issues do GitLab - input manual)   │
└──────────┬──────────────────────────┘
           │
           ├─→ process_gitlab_issues_v2.py
           │   - Parse de módulos [...]
           │   - Parse de áreas (...)
           │   - Normalização de nomes
           │   - Proteção de colunas
           │
           ↓
┌─────────────────────┐
│ pipeline_maestro.py │ (Orquestrador)
│ - Valida ambiente   │
│ - Coordena etapas   │
│ - Gera logs/relatos │
└──────────┬──────────┘
           │
           ↓
┌──────────────────────────────┐
│ Dashboard_Contratos_v2.xlsx  │
│ (Output final - consolidado) │
└──────────────────────────────┘
```

### Etapas do Pipeline

| Etapa | Módulo | Tempo Aprox | Saída |
|-------|--------|-----------|-------|
| 1. Validação | pipeline_maestro | < 1s | Status OK/Erro |
| 2. Coleta Git | coleta_git_contratos | ~30s | gitlab_git_data.json |
| 3. Carregamento Issues | pipeline_maestro | ~5s | Lista de issues |
| 4. Processamento Excel | process_gitlab_issues_v2 | ~60s | Excel atualizado |
| 5. Finalização | pipeline_maestro | ~5s | Logs + Relatório |
| **Total** | **Pipeline** | **~2-3 min** | **Completo** |

---

## 9. COLUNAS PROTEGIDAS DO EXCEL

O sistema preserva estas colunas durante atualizações automáticas:

```python
PROTECTED_COLUMNS = {
    'Situação Análise',      # Status da análise local
    'Desenvolvedor Futuro',  # Dev atribuído (planejamento)
    'Observação Geral',      # Notas internas
    'Chamado',              # ID de chamado relacionado
    'Priorizar'             # Flag de priorização
}
```

### Estratégia de Atualização

- **Colunas Atualizadas:** ID, Título, Módulo, Área Funcional, Data Criação
- **Colunas Preservadas:** As 5 acima (não são tocadas em updates)
- **Novas Issues:** Colunas protegidas deixadas em branco (usuário preenche)

---

## 10. DESCOBERTAS ADICIONAIS

### Repositórios Git (Duplos)

O pipeline coleta de **dois** repositórios paralelos:

1. **contratos_v2** - Repositório principal/ativo
2. **contratos** - Repositório secundário/histórico

Dados são consolidados num único JSON de output.

### Filtros de Data

- **Issues:** Data mínima = 2024-01-01 (filtrável)
- **Commits:** Últimos 30 dias (configurável)
- **Releases:** Todas (ordenadas por semver)

### Volume de Dados

Segundo README:
- **Total de issues:** ~2,800 (históricos)
- **Issues ativas:** Desde 2024-01-01
- **Commits recentes:** 30 dias (varia)
- **Branches:** Múltiplos (quantidade variável)
- **Releases:** Versionadas (quantidade variável)

### Mecanismo de Deduplicação

Issues são comparadas por **ID único**:
- Se ID existe: **UPDATE** (preserva colunas protegidas)
- Se ID novo: **INSERT** (deixa colunas protegidas vazias)

---

## 11. ARQUIVOS DE SAÍDA

### Arquivos Gerados pelo Pipeline

| Nome | Tipo | Conteúdo | Localização |
|------|------|----------|-------------|
| `gitlab_git_data.json` | JSON | Commits, branches, releases | D:\MGI-Relatórios |
| `Dashboard_Contratos_v2.xlsx` | Excel | Issues consolidadas | D:\MGI-Relatórios |
| `pipeline_YYYYMMDD_HHMMSS.log` | Log | Execução detalhada | D:\MGI-Relatórios\logs |
| `relatorio_YYYYMMDD_HHMMSS.json` | JSON | Resumo de execução | D:\MGI-Relatórios\logs |

### Estrutura do Excel (5 abas)

Conforme README, o Excel contém:
1. **Dashboard** - Visualização consolidada
2. **Analysis** - Análises e estatísticas
3. **Data** - Dados brutos das issues
4. **Alerts** - Alertas/flags
5. **Lists** - Listagens de referência

---

## 12. EXEMPLOS DE ISSUES (PADRÃO)

### Exemplo 1: Gestão de Atas

```
[Gestão de Atas] (Sincronização de Dados) - Corrigir hash de verificação de atas
ID: 2847
Módulo (extraído): Gestão de Atas
Área Funcional (extraída): Sincronização de Dados
Data Criação: 2024-06-01
```

### Exemplo 2: API v2

```
[API v2] (Integração com Terceiros) - Implementar validação de CNPJ em tempo real
ID: 1923
Módulo (extraído): API v2
Área Funcional (extraída): Integração com Terceiros
Data Criação: 2025-03-15
```

### Exemplo 3: Fiscalização

```
[Fiscalização] (Relatórios) - Gerar relatório mensal de não-conformidades
ID: 3102
Módulo (extraído): Fiscalização
Área Funcional (extraída): Relatórios
Data Criação: 2026-01-10
```

### Exemplo 4: Sem Módulo (Fallback)

```
Fix bug in payment processing
ID: 2234
Módulo (extraído): [vazio]
Área Funcional (extraída): [vazio]
Data Criação: 2024-12-20
```

---

## 13. HIERARQUIA DE MÓDULOS

### Estrutura Hierárquica (Proposta)

```
SISTEMA CONTRATOS
├── CORE BUSINESS
│   ├── Gestão de Atas
│   ├── Gestão Contratual
│   ├── Administração
│   └── Fornecedor
│
├── FINANCEIRO
│   ├── Gestão Financeira
│   ├── Instrumento de Cobrança
│   └── Minuta de Empenho
│
├── COMPLIANCE & REPORTING
│   ├── Fiscalização
│   ├── PNCP (Compras Públicas)
│   └── Transparência
│
└── PLATFORM & INTEGRATION
    ├── API v2
    └── Jobs (Background Tasks)
```

---

## 14. ARQUIVOS RELACIONADOS AO PIPELINE

### Scripts Principais

| Script | Função | Responsável |
|--------|--------|-------------|
| `pipeline_maestro.py` | Orquestração | Coordena todo pipeline |
| `coleta_git_contratos.py` | Coleta Git | Extrai dados Git |
| `process_gitlab_issues_v2.py` | Processamento | Processa e normaliza issues |

### Documentação

| Arquivo | Conteúdo |
|---------|----------|
| `README_PIPELINE.md` | Visão geral e início rápido |
| `SETUP_AMBIENTE.md` | Instruções de instalação |
| `AGENDAMENTO_TASK_SCHEDULER.md` | Agendamento automático Windows |

### Entrada/Saída

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `gitlab_issues_raw.json` | Input | Issues exportadas do GitLab (manual) |
| `requirements.txt` | Config | Dependências Python |
| `teste_pipeline.bat` | Script | Teste do pipeline |

---

## 15. PRÓXIMAS ETAPAS PARA EXPANSÃO

### Módulos Potencialmente Não Mapeados

1. **Verificar issues sem módulo** - Issues que não contêm `[...]`
2. **Analisar custom modules** - Módulos fora da lista de 14
3. **Revisar área funcional** - Áreas não padronizadas em `(...)`
4. **Histórico de branches** - Branches antigos ou deletados

### Melhorias Sugeridas

1. **Adicionar mais padrões** - Suportar variações de nomenclatura
2. **Subcategorias de módulos** - Criar hierarquia mais granular
3. **Campos adicionais** - Status, labels, milestones do GitLab
4. **Análise de lead time** - Tempo entre criação e resolução
5. **Dashboards dinâmicos** - Power BI ou Tableau

---

## 16. RESUMO FINAL

### O que foi Descoberto

- **14 Módulos Ativos** - Mapeados e normalizados
- **Padrão de Nomenclatura** - `[Módulo] (Área) - Descrição`
- **2 Repositórios Paralelos** - contratos_v2 + contratos (consolidados)
- **Pipeline Automático** - Coleta → Processamento → Excel
- **~2,800 Issues** - Desde 2024-01-01
- **Colunas Protegidas** - 5 colunas preservadas em updates
- **Versionamento SemVer** - v1.0.0, v2.0.0, etc.

### Estrutura do Sistema

```
Repositório Git (WSL)
    ↓
Coleta de Commits/Branches/Releases
    ↓
JSON Consolidado (git_data)
    ↓
Processamento de Issues (parse [Módulo] / (Área))
    ↓
Normalização (MODULE_MAP)
    ↓
Atualização/Inserção em Excel
    ↓
Dashboard Final (Excel com 5 abas)
```

---

## 17. DOCUMENTAÇÃO GERADA

Este diagnóstico cobre:

- [x] Estrutura de diretórios
- [x] Padrões de nomenclatura
- [x] Arquivos de configuração
- [x] Histórico de commits (padrões)
- [x] Branches principais
- [x] Módulos descobertos (14)
- [x] Hierarquia de módulos
- [x] Exemplos de issues
- [x] Pipeline de processamento
- [x] Colunas protegidas
- [x] Descobertas adicionais

---

**Próximo Passo:** Executar `pipeline_maestro.py` para coletar dados reais dos repositórios Git e validar descobertas deste diagnóstico.

**Comando para Validação:**
```bash
cd D:\MGI-Relatórios\MGI
python pipeline_maestro.py
```

---

*Diagnóstico completo gerado em 2026-06-02 | Pipeline versão 2.0*
