# Índice de Documentos - Diagnóstico do Pipeline GitLab

**Data:** 2026-06-02  
**Escopo:** Repositório contratos_v2 + contratos  
**Status:** Diagnóstico Completo

---

## Documentos Gerados

### 1. **DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md** (Completo)
Documento técnico completo com 17 seções detalhadas.

**Conteúdo:**
- Estrutura de diretórios
- Padrões de nomenclatura
- 14 módulos descobertos
- Histórico de commits (padrões)
- Branches e releases
- Arquivos de configuração
- Pipeline de processamento
- Colunas protegidas Excel
- Exemplos de issues
- Hierarquia de módulos
- Arquivos relacionados
- Próximas etapas

**Quando usar:** 
- Referência técnica completa
- Documentação oficial do projeto
- Base para expansões futuras
- Compartilhar com novo pessoal

**Tamanho:** ~15 páginas

---

### 2. **MÓDULOS_RESUMO_EXECUTIVO.txt** (Quick Reference)
Resumo executivo em formato texto com tabelas ASCII.

**Conteúdo:**
- Módulos em tabela (ID, nome, variações, categoria)
- Padrão de nomenclatura
- Categorias funcionais
- Padrões de commit
- Estrutura de branches
- Fluxo do pipeline
- Colunas protegidas
- Arquivos principais
- Volume de dados
- Descobertas chave
- Próximas etapas
- Hierarquia
- Comando para validação

**Quando usar:**
- Referência rápida durante desenvolvimento
- Compartilhar em reuniões
- Imprimir e colar no mural/wiki
- Onboarding de novos devs

**Tamanho:** ~5 páginas (texto puro)


### 3. **ROADMAP_EXPANSÃO_PIPELINE.md** (Strategic)
Roadmap detalhado com 7 fases de expansão do pipeline.

**Fases:**
1. Validação e Consolidação (Imediato)
2. Expansão de Padrões (Semana 1-2)
3. Dashboards Avançados (Semana 3-4)
4. Enriquecimento de Dados (Mês 2)
5. Automação Avançada (Mês 3)
6. Análises Preditivas (Mês 4)
7. Documentação e Treinamento (Contínuo)

**Seções Incluídas:**
- Objetivos de cada fase
- Ações específicas
- Código de exemplo
- Cronograma
- Dependências
- Métricas de sucesso
- Riscos e mitigação

**Quando usar:**
- Planejar próximas iterações
- Definir prioridades
- Alinhar com stakeholders
- Executivo resumes/business cases

**Tamanho:** ~20 páginas

---

## Estrutura Recomendada de Leitura

### Para Leitura Rápida (5-10 min):
1. **MÓDULOS_RESUMO_EXECUTIVO.txt** - Entender o big picture
2. **REFERÊNCIA_RÁPIDA_MÓDULOS.csv** - Ver módulos em tabela

### Para Implementação (30-60 min):
1. **DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md** (Seções 1-9) - Entender structure
2. **DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md** (Seções 10-14) - Dados e pipeline
3. **ROADMAP_EXPANSÃO_PIPELINE.md** (Fase 1) - Próximos passos

### Para Planejamento Estratégico (2 horas):
1. **DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md** (Completo)
2. **ROADMAP_EXPANSÃO_PIPELINE.md** (Completo)
3. **REFERÊNCIA_RÁPIDA_MÓDULOS.csv** (Para análises)

### Para Onboarding de Novo Pessoal:
1. **MÓDULOS_RESUMO_EXECUTIVO.txt** - Overview
2. **REFERÊNCIA_RÁPIDA_MÓDULOS.csv** - Referência
3. **DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md** (Seções 2, 3, 12) - Padrões e exemplos

---

## Arquivos Relacionados (Já Existentes)

### Documentação do Pipeline
```
D:\MGI-Relatórios\MGI\
├── README_PIPELINE.md                  # Visão geral pipeline
├── SETUP_AMBIENTE.md                   # Instalação
├── AGENDAMENTO_TASK_SCHEDULER.md       # Windows scheduling
```

### Scripts Python
```
D:\MGI-Relatórios\MGI\
├── pipeline_maestro.py                 # Orquestrador
├── coleta_git_contratos.py             # Coleta Git
├── process_gitlab_issues_v2.py         # Processamento
├── requirements.txt                    # Dependências
└── teste_pipeline.bat                  # Script teste
```

### Dados
```
D:\MGI-Relatórios\
├── gitlab_issues_raw.json              # Issues (input)
├── gitlab_git_data.json                # Git data (intermediate)
├── Dashboard_Contratos_v2.xlsx         # Excel final
└── MGI_Dashboard.xlsx                  # Dashboard
```

---

## Como Usar Esta Documentação

### Cenário 1: "Estou codificando e preciso de referência rápida"
**Abrir:** `MÓDULOS_RESUMO_EXECUTIVO.txt`
- Scroll até a seção relevante
- Procure pelo módulo que precisa
- Veja exemplos de padrão de issue

### Cenário 2: "Estou entrando na equipe e preciso entender tudo"
**Sequência:**
1. Ler `MÓDULOS_RESUMO_EXECUTIVO.txt` (overview)
2. Ler `DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md` seções 1-6
3. Examinar `REFERÊNCIA_RÁPIDA_MÓDULOS.csv`
4. Executar `pipeline_maestro.py` para ver em ação

### Cenário 3: "Queremos expandir o pipeline"
**Sequência:**
1. Validar com `ROADMAP_EXPANSÃO_PIPELINE.md` Fase 1
2. Implementar mudanças usando `DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md`
3. Testar usando `teste_pipeline.bat`
4. Documentar descobertas de volta nesta documentação

### Cenário 4: "Encontramos uma issue com padrão estranho"
**Processo:**
1. Verificar em `REFERÊNCIA_RÁPIDA_MÓDULOS.csv` se módulo existe
2. Se não existe, ver `DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md` Seção 13-14
3. Decidir: é novo módulo ou variação existente?
4. Propor mudança usando `ROADMAP_EXPANSÃO_PIPELINE.md` Fase 2

---

## Informações-Chave para Copiar/Colar

### Padrão de Nomenclatura de Issue
```
[MÓDULO] (ÁREA FUNCIONAL) - Descrição Breve
```

Exemplo:
```
[Gestão de Atas] (Sincronização de Dados) - Corrigir hash de verificação
```

### Módulos Disponíveis (Copy/Paste)
```
1. Gestão de Atas
2. Transparência
3. API v2
4. Fiscalização
5. Fornecedor
6. Gestão Contratual
7. Gestão Financeira
8. Instrumento de Cobrança
9. Jobs
10. Minuta de Empenho
11. PNCP
12. Administração
```

### Comando para Validar Pipeline
```bash
cd D:\MGI-Relatórios\MGI
python pipeline_maestro.py
```

### Variações de Módulos Aceitas
```
Gestão de Atas   → pode ser: "Gestão de Ata", "GESTÃO DE ATAS"
Transparência    → pode ser: "Transparencia"
API v2          → pode ser: "API"
(Outros módulos não têm variações mapeadas)
```

---

## Métricas do Diagnóstico

| Métrica | Valor |
|---------|-------|
| Módulos Descobertos | 14 |
| Repositórios Analisados | 2 (contratos_v2 + contratos) |
| Issues Mapeadas | ~2,800 |
| Período de Dados | 2024-01-01 em diante |
| Colunas Protegidas | 5 |
| Padrões de Commit | 7+ |
| Documentos Gerados | 4 |
| Fases de Roadmap | 7 |
| Tamanho Total de Docs | ~45 páginas |


## Glossário Rápido

| Termo | Significado |
|-------|------------|
| **Módulo** | Área de negócio principal (ex: Gestão de Atas) |
| **Área Funcional** | Subcategoria dentro de módulo (ex: Sincronização) |
| **Lead Time** | Tempo de criação até fechamento de issue |
| **SemVer** | Versionamento Semântico (v1.0.0, v2.0.0, etc.) |
| **MODULE_MAP** | Dicionário de normalização de módulos em Python |
| **AREA_MAP** | Dicionário de normalização de áreas (proposto) |
| **DW** | Data Warehouse - repositório centralizado de dados |
| **BI** | Business Intelligence - análises e dashboards |

---

