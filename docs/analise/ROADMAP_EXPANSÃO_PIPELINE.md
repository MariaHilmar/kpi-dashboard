# Roadmap de Expansão do Pipeline de Coleta GitLab

**Data:** 2026-06-02  
**Status:** Proposta  
**Versão:** Pipeline 2.0+

---

## Visão Geral

Este documento apresenta um roadmap de expansão para o pipeline de coleta de dados do GitLab contratos_v2, baseado no diagnóstico completo realizado em 2026-06-02.

---

## Fase 1: Validação e Consolidação (Imediato)

### 1.1 Executar Pipeline com Dados Reais

**Objetivo:** Validar descobertas do diagnóstico com dados vivos do repositório.

**Ações:**
```bash
cd D:\MGI-Relatórios\MGI
python pipeline_maestro.py
```

**Verificações:**
- [ ] Coleta bem-sucedida de ambos repositórios (contratos_v2 + contratos)
- [ ] JSON de issues carregado corretamente
- [ ] Módulos extraídos com acurácia > 95%
- [ ] Excel consolidado gerado sem erros
- [ ] Logs salvos e relatório de execução gerado

**Entregáveis:**
- gitlab_git_data.json (com dados reais)
- Dashboard_Contratos_v2.xlsx (atualizado)
- Logs de execução completos

---

### 1.2 Análise de Issues Não Mapeadas

**Objetivo:** Identificar issues que não seguem o padrão `[MÓDULO]`.

**Método:**

```sql
-- Pseudo-SQL para análise
SELECT COUNT(*), 
       CASE WHEN title NOT LIKE '[%' THEN 'Sem Módulo'
            ELSE 'Com Módulo'
       END as classification
FROM issues
GROUP BY classification;
```

**Análise Manual:**
1. Filtrar issues em `Dashboard_Contratos_v2.xlsx` onde coluna "Módulo" está vazia
2. Extrair uma amostra de 20-30 issues
3. Identificar padrões alternativos (ex: módulo no final, em maiúsculas, etc.)
4. Classificar como:
   - "Candidato a novo módulo" (recorrente)
   - "Typo/Variação existente" (pode ser normalizado)
   - "Realmente sem classificação" (legítimamente não modular)

**Saída esperada:**
- Relatório de issues não mapeadas (top 10)
- Sugestões de novos módulos (se houver)
- Recomendações de normalização

---

### 1.3 Auditoria de Áreas Funcionais

**Objetivo:** Validar e padronizar áreas funcionais `(ÁREA)`.

**Método:**
1. Extrair todas as áreas únicas das issues
2. Agrupar por módulo
3. Identificar variações ortográficas
4. Decidir: manter ou normalizar

**Exemplo esperado:**
```
Gestão de Atas:
  - Sincronização de Dados (15 issues)
  - Sincronização (8 issues) → MESCLAR
  - Sync (2 issues) → MESCLAR
  - administração de dados (1 issue) → PADRONIZAR

API v2:
  - Integração com Terceiros (20 issues)
  - Integrações (5 issues) → MESCLAR
  - WebHooks (3 issues) → ESPECIALIZAR?
```

**Saída esperada:**
- Dicionário de áreas por módulo
- Lista de áreas a normalizar
- Recomendações de splitting (ex: WebHooks como módulo separado?)

---

## Fase 2: Expansão de Padrões (Semana 1-2)

### 2.1 Implementar Normalização de Áreas

**Objetivo:** Adicionar `AREA_MAP` análogo ao `MODULE_MAP`.

**Código (em process_gitlab_issues_v2.py):**

```python
# Adicionar após MODULE_MAP
AREA_MAP = {
    'Sincronização': 'Sincronização de Dados',
    'Sync': 'Sincronização de Dados',
    'Integrações': 'Integração com Terceiros',
    'WebHooks': 'Integração com Terceiros',  # ou especializar
    'administração de dados': 'Administração de Dados',
    'Auditoria': 'Auditoria e Conformidade',
    'Auditorias': 'Auditoria e Conformidade',
    # ... adicionar mais conforme descobrir
}

def extract_functional_area(title):
    """Extract and standardize functional area from title"""
    match = re.search(r'\]\(?([^)]+)\)?', title)
    if match:
        area = match.group(1).strip()
        if area.startswith('('):
            area = area[1:-1].strip()
        if area.startswith('- '):
            area = area[2:]
        # NOVO: Normalizar
        return AREA_MAP.get(area, area)
    return ''
```

**Testes:**
- Validar que variações são normalizadas corretamente
- Verificar que áreas não mapeadas são preservadas (fallback)
- Testar na próxima execução do pipeline

---

### 2.2 Adicionar Suporte a Novos Módulos (se identificados)

**Procedimento:**

1. **Se descobriu novos módulos no Phase 1:**
   - Análise: É recorrente? (>5 issues)
   - Decisão: Adicionar ao MODULE_MAP?
   - Implementação: Atualizar constant em process_gitlab_issues_v2.py

2. **Exemplo - Se descobriu "Auditoria" como módulo:**

```python
MODULE_MAP = {
    # ... módulos existentes ...
    'Auditoria': 'Auditoria',  # Novo!
    'Compliance': 'Auditoria',  # Variação
}
```

**Mudança de categoria (se necessário):**
- Atualizar hierarquia em roadmap
- Ajustar dashboard se necessário
- Documentar no DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md

---

### 2.3 Expandir Coleta de Metadados

**Objetivo:** Coletar dados adicionais do GitLab para análises mais ricas.

**Dados Adicionais a Coletar:**

```json
{
  "issue": {
    "id": 2847,
    "title": "[Gestão de Atas] (Sincronização) - Corrigir hash",
    
    // Atuais
    "module": "Gestão de Atas",
    "area": "Sincronização de Dados",
    
    // NOVOS
    "labels": ["bug", "high-priority", "database"],
    "milestone": "v1.5.0",
    "assignee": "maria.silva@example.com",
    "created_date": "2024-06-01",
    "closed_date": "2024-06-15",  // null se aberto
    "lead_time_days": 14,
    "status": "closed",  // ou "open"
    "priority": 1,  // extraído de label?
  }
}
```

**Implementação:**
1. Atualizar script de export do GitLab (ou JSON source)
2. Coletar no processo_gitlab_issues_v2.py
3. Adicionar colunas ao Excel

**Benefício:** Análises de lead time, tendências, priorização automática

---

## Fase 3: Dashboards Avançados (Semana 3-4)

### 3.1 Excel Dinâmico com Fórmulas

**Objetivo:** Criar análises automáticas em Excel.

**Fórmulas a Adicionar:**

```excel
ABA: Analysis

Dashboard Consolidado:
  • Total Issues: =COUNTA(Data!A:A)-1
  • Issues por Módulo: =COUNTIF(Data!D:D,"Gestão de Atas")
  • Lead Time Médio: =AVERAGE(Data!L:L)
  • Issues Abertas: =COUNTIF(Data!N:N,"open")
  • Issues Fechadas: =COUNTIF(Data!N:N,"closed")

Tabelas Dinâmicas:
  • Pivot por Módulo (contagem)
  • Pivot por Área (lead time)
  • Pivot por Status (temporal)

Gráficos:
  • Bar: Issues por Módulo
  • Line: Trend de issues abertas/fechadas
  • Pie: Distribuição de prioridades
```

**Ferramenta:** Excel nativo (COUNTIF, SUMIF, Pivot Tables) ou Power Query

---

### 3.2 Power BI (Opcional)

**Objetivo:** Dashboard interativo para análises ad-hoc.

**Estrutura:**

```
Power BI Data Model:
├── Fact Issues
│   ├── Issue ID (PK)
│   ├── Created Date
│   ├── Closed Date
│   ├── Lead Time Days
│   └── Module ID (FK)
│
├── Dim Modules
│   ├── Module ID (PK)
│   ├── Module Name
│   └── Category
│
└── Dim Dates
    ├── Date
    ├── Month
    ├── Quarter
    └── Year
```

**Visualizações:**
- Dashboard principal (KPIs)
- Lead time analysis (por módulo)
- Heatmap de atividade
- Trend de issues
- Decomposição por módulo/área

---

## Fase 4: Enriquecimento de Dados (Mês 2)

### 4.1 Integração com API GitLab

**Objetivo:** Coletar dados diretamente da API GitLab (se token disponível).

**Benefícios:**
- Dados em tempo real (não manual)
- Campos adicionais (assignees, reviewers, emojis, etc.)
- Histórico completo de mudanças
- Labels automáticas

**Implementação:**
```python
# Novo: GitLabAPIColeta.py
import requests

class GitLabAPIColeta:
    def __init__(self, gitlab_url, token):
        self.gitlab_url = gitlab_url
        self.headers = {"PRIVATE-TOKEN": token}
    
    def coleta_issues(self, project_id):
        """Coleta issues via API"""
        url = f"{self.gitlab_url}/api/v4/projects/{project_id}/issues"
        response = requests.get(url, headers=self.headers)
        return response.json()
    
    def coleta_merge_requests(self, project_id):
        """Coleta MRs para análise de código"""
        url = f"{self.gitlab_url}/api/v4/projects/{project_id}/merge_requests"
        return requests.get(url, headers=self.headers).json()
```

**Dados Adicionais:**
- Assignees (responsável)
- Reviewers (revisores)
- Merge requests relacionados
- Commits que mencionam issue
- Time to close (SLA)

---

### 4.2 Análise de Lead Time

**Objetivo:** Medir eficiência do processo de resolução.

**Métrica:**
```
Lead Time = Data Fechamento - Data Criação
```

**Análise por:**
- Módulo (qual é mais rápido?)
- Área (qual área é gargalo?)
- Prioridade (issues críticas são mais rápidas?)
- Autor (qual dev fecha mais rápido?)
- Período (melhorando com o tempo?)

**Saída:**
```
Módulo              | Média LT | Mediana LT | Max LT
==================|=========|============|========
Gestão de Atas     | 7 dias   | 5 dias     | 45 dias
API v2             | 12 dias  | 10 dias    | 60 dias
Fiscalização       | 3 dias   | 2 dias     | 20 dias
Fornecedor         | 15 dias  | 12 dias    | 90 dias
...
```

---

### 4.3 Análise de Tendências

**Objetivo:** Identificar padrões de atividade.

**Análises:**
1. **Tendência de issues abertas:** Aumentando? Diminuindo?
2. **Módulos em crescimento:** Quais áreas mais ativas?
3. **Períodos pico:** Quando há mais abertura de issues?
4. **Distribuição de autores:** Quem abre mais issues?

**Visualizações:**
- Gráfico de linha: Issues abertas por mês
- Heatmap: Atividade por dia da semana
- Scatter: Lead time vs complexidade (labels)

---

## Fase 5: Automação Avançada (Mês 3)

### 5.1 Agendamento Automático

**Status:** Já implementado (ver AGENDAMENTO_TASK_SCHEDULER.md)

**Verificação:**
- [ ] Task agendada no Windows Task Scheduler
- [ ] Executa diariamente (ou período desejado)
- [ ] Logs são preservados para auditoria
- [ ] Alertas configurados se falhar

**Frequência recomendada:** Diária (madrugada) ou em horários baixos

---

### 5.2 Alertas Automáticos

**Objetivo:** Notificar sobre anomalias ou métricas críticas.

**Implementação:**
```python
# novo_alert_system.py
class AlertSystem:
    def verificar_alertas(self, dados):
        """Verifica métricas e gera alertas"""
        alertas = []
        
        # Alerta 1: Muitas issues abertas em módulo
        for modulo, count in self.issues_por_modulo.items():
            if count > 100:
                alertas.append(f"⚠️ {modulo}: {count} issues abertas")
        
        # Alerta 2: Lead time acima do SLA
        for issue in dados['issues']:
            if issue['lead_time_days'] > 30:
                alertas.append(f"🚨 Issue #{issue['id']}: {issue['lead_time_days']} dias")
        
        # Alerta 3: Issues sem atribuição
        unassigned = [i for i in dados['issues'] if not i.get('assignee')]
        if len(unassigned) > 5:
            alertas.append(f"⚠️ {len(unassigned)} issues sem atribuição")
        
        return alertas
    
    def enviar_alerta(self, alerta, email_dest):
        """Envia alerta por email"""
        # Usar smtplib ou serviço de email
        pass
```

**Canais de Alerta:**
- [ ] Email (para gestores)
- [ ] Slack (se integrado)
- [ ] Relatório em arquivo
- [ ] Dashboard em tempo real

---

### 5.3 Exportação para Data Warehouse

**Objetivo:** Centralizar dados em repositório único para BI.

**Arquitetura Proposta:**

```
Pipeline Git (contratos_v2/contratos)
    ↓
Process / Normalize (Python)
    ↓
JSON Consolidado
    ↓
┌─────────────────────────────┐
│ Data Warehouse (opcional)   │
│ • PostgreSQL                │
│ • MongoDB                   │
│ • Google BigQuery           │
│ • Snowflake                 │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ BI Platform                 │
│ • Power BI                  │
│ • Tableau                   │
│ • Looker                    │
└─────────────────────────────┘
```

**Esquema DW (exemplo PostgreSQL):**

```sql
-- Tabela Fato
CREATE TABLE fact_issues (
    issue_id INT,
    module_id INT,
    area_id INT,
    created_date DATE,
    closed_date DATE,
    lead_time_days INT,
    status VARCHAR(20),
    assignee_id INT,
    
    PRIMARY KEY (issue_id),
    FOREIGN KEY (module_id) REFERENCES dim_modules(id),
    FOREIGN KEY (area_id) REFERENCES dim_areas(id),
    FOREIGN KEY (assignee_id) REFERENCES dim_users(id)
);

-- Tabelas Dimensão
CREATE TABLE dim_modules (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50)
);

CREATE TABLE dim_areas (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    module_id INT REFERENCES dim_modules(id)
);
```

---

## Fase 6: Análises Preditivas (Mês 4)

### 6.1 Previsão de Lead Time

**Objetivo:** Prever quanto tempo uma issue levará para ser fechada.

**Método:** Machine Learning (Python - scikit-learn)

```python
# modelo_predicao.py
from sklearn.ensemble import RandomForestRegressor

def treinar_modelo_lead_time(dados_historicos):
    """Treina modelo preditivo"""
    X = np.array([
        [modulo_id, area_id, n_labels, prioridade]
        for issue in dados_historicos
    ])
    y = np.array([issue['lead_time_days'] for issue in dados_historicos])
    
    modelo = RandomForestRegressor(n_estimators=100)
    modelo.fit(X, y)
    
    return modelo

def prever_lead_time(issue, modelo):
    """Prevê lead time de uma nova issue"""
    X_novo = [[issue['module_id'], issue['area_id'], 
               len(issue['labels']), issue['priority']]]
    return modelo.predict(X_novo)[0]
```

**Casos de Uso:**
- SLA estimado para cliente
- Detecção de issues em risco de atraso
- Recomendações de priorização

---

### 6.2 Análise de Causalidade

**Objetivo:** Entender fatores que afetam lead time.

**Análise:**
```
Fator que afeta Lead Time:
1. Módulo (qual módulo é mais complexo?)
2. Número de labels (mais labels = mais complexo?)
3. Atribuição (dev experiente fecha mais rápido?)
4. Tempo do ano (períodos específicos são mais lentos?)
5. Tipo de mudança (fix vs feat vs refactor?)
```

**Visualização:** Gráfico de importância de features (feature importance)

---

## Fase 7: Documentação e Treinamento (Contínuo)

### 7.1 Manutenção do Diagnóstico

**Objetivo:** Manter diagnóstico atualizado com descobertas.

**Frequência:** Trimestral (ou quando novos módulos são descobertos)

**Checklist:**
- [ ] Executar análise de issues não mapeadas
- [ ] Atualizar MODULE_MAP se necessário
- [ ] Revisar AREA_MAP
- [ ] Documentar novos padrões
- [ ] Atualizar DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md
- [ ] Comunicar mudanças ao time

---

### 7.2 Treinamento de Usuários

**Objetivo:** Assegurar que novo padrões são seguidos.

**Documentação:**
- [ ] Guia de como nomeir issues (padrão de título)
- [ ] Exemplos de boas práticas
- [ ] Módulos e áreas disponíveis (reference card)
- [ ] Como reportar novo módulo/área

**Comunicação:**
- [ ] Email para time explicando padrão
- [ ] Wiki interna com exemplos
- [ ] Treinamento em reunião (se grande mudança)

---

## Cronograma Proposto

```
Junho 2026:
  └─ Fase 1: Validação e Consolidação
     (Semana 1-2)

Julho 2026:
  ├─ Fase 2: Expansão de Padrões
  │  (Semana 1-2)
  └─ Fase 3: Dashboards Avançados
     (Semana 3-4)

Agosto 2026:
  └─ Fase 4: Enriquecimento de Dados
     (Todo mês)

Setembro 2026:
  └─ Fase 5: Automação Avançada
     (Todo mês)

Outubro 2026 em diante:
  ├─ Fase 6: Análises Preditivas
  └─ Fase 7: Documentação e Treinamento (Contínuo)
```

---

## Dependências e Recursos

### Ferramentas Necessárias

| Ferramenta | Fase | Status | Custo |
|-----------|------|--------|-------|
| Python 3.8+ | 1 | ✓ Existe | -  |
| openpyxl | 1 | ✓ Existe | - |
| pandas (expandir) | 2 | Adicionar | - |
| scikit-learn | 6 | Adicionar | - |
| Power BI | 3 | Opcional | $ |
| PostgreSQL/MongoDB | 5 | Opcional | $ |

### Pessoal Necessário

| Função | Fase | Tempo | Notas |
|--------|------|-------|-------|
| Analyst | 1-3 | 4-6h/semana | Validar padrões |
| Developer | 2,4,5 | 2-3h/semana | Implementar mudanças |
| BI Engineer | 3-6 | 1-2h/semana | Dashboards/modelos |
| Product Owner | 1,7 | 1h/semana | Priorização/comunicação |

---

## Métricas de Sucesso

### Fase 1: Validação
- [ ] 100% de issues com módulo extraído
- [ ] 0 erros críticos no pipeline
- [ ] Tempo de execução < 5 min

### Fase 2: Expansão
- [ ] Novos módulos integrados (se houver)
- [ ] Áreas normalizadas (>90% de cobertura)
- [ ] Zero issues perdidas em mapeamento

### Fase 3: Dashboards
- [ ] Excel com 5+ painéis analíticos
- [ ] Fórmulas dinâmicas funcionando
- [ ] Gráficos atualizados automaticamente

### Fase 4: Enriquecimento
- [ ] Lead time calculado para todas as issues
- [ ] Tendências visualizadas
- [ ] Alertas funcionando

### Fase 5: Automação
- [ ] Pipeline executa sem intervenção
- [ ] Alertas enviados corretamente
- [ ] Histórico preservado para auditoria

### Fase 6: Preditivas
- [ ] Modelo treinado com R² > 0.7
- [ ] Previsões com ±30% de acurácia
- [ ] Fatores de causalidade identificados

---

## Riscos e Mitigação

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Issues sem padrão padronizado | Alto | Média | Enforce template em GitLab |
| Dados históricos inconsistentes | Médio | Alta | Limpeza de dados em Fase 1 |
| Token GitLab API indisponível | Médio | Baixa | Manter fallback com Git local |
| DW/BI infrastructure custos | Médio | Média | Começar com Excel, expandir depois |
| Resistência à mudança de padrão | Baixo | Média | Comunicação clara + treinamento |

---

## Conclusão

Este roadmap fornece um caminho claro para expandir o pipeline de coleta de dados do GitLab, desde validação imediata até análises preditivas avançadas. 

**Recomendação:** Começar pela **Fase 1** (Validação) imediatamente, consolidar descobertas, e progressivamente implementar fases posteriores conforme recursos e necessidade.

**Próximo Passo:** Executar `python pipeline_maestro.py` para validar diagnóstico com dados reais.

---

*Roadmap versão 1.0 - Junho 2026*
*Baseado em diagnóstico completo do repositório contratos_v2*
