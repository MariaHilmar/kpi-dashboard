# PLANO DE EXPANSÃO - FASE 1
## Padronização de "Área Funcional" + Detecção de Padrões

**Data:** 2026-06-02  
**Status:** Planejamento Estratégico  
**Objetivo:** Expandir pipeline para automatizar detecção de "Área Funcional" com inteligência de padrões

---

## 📋 SUMÁRIO EXECUTIVO

Você tem um pipeline robusto com 14 módulos já mapeados. Agora vamos adicionar **3 capacidades principais**:

1. **Detecção de Padrões** - Analisar issues sem PR/MR para inferir "Área Funcional"
2. **Linkage PR/MR** - Rastrear relacionamentos para categorização automática
3. **Sistema de Fallback** - Tratamento inteligente de issues órfãs

---

## 🎯 FASE 1: ARQUITETURA DE PADRÕES

### Estrutura de Dados

```python
# Nova estrutura em process_gitlab_issues_v2.py
PATTERN_DATABASE = {
    'Gestão de Atas': {
        'keywords': ['ata', 'meeting', 'reunião', 'attendance', 'presença'],
        'label_keywords': ['ata', 'meeting', 'reunião'],
        'example_issues': [2847, 2845, 2844],  # IDs conhecidos
        'confidence_level': 0.95
    },
    'Transparência': {
        'keywords': ['transparência', 'transparency', 'audit', 'auditoria', 'log'],
        'label_keywords': ['transparency', 'audit'],
        'example_issues': [2846, 2840],
        'confidence_level': 0.92
    },
    # ... (14 módulos total)
}

# Mapear PR/MR para Área Funcional
FUNCTIONAL_AREA_MAPPING = {
    'api-v2': ['Sincronização de Dados', 'Integração', 'Performance'],
    'atas-sync': ['Sincronização de Dados', 'Conformidade'],
    'fiscal-module': ['Validação', 'Compliance', 'Relatórios'],
    # ... (descobrir dinamicamente de commits)
}
```

### Algoritmo de Detecção (3 Níveis)

```
┌─────────────────────────────────────────┐
│  ISSUE SEM PR/MR RELACIONADO            │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
[NÍVEL 1]         [NÍVEL 2]
Pattern Match     Branch Analysis
Title + Desc      (git branch -a)
│                 │
├─ Keywords       ├─ hotfix/area-*
├─ Labels         ├─ feature/area-*
└─ Histórico      └─ bugfix/area-*
    │                 │
    └─────────┬───────┘
              ▼
        [NÍVEL 3]
        Manual Review
        (Flag baixa confiança)
              │
              ▼
        ✅ Área Funcional
```

---

## 🔧 IMPLEMENTAÇÃO: 5 COMPONENTES

### 1️⃣ MÓDULO: PatternDetector

```python
# novo arquivo: pattern_detector.py

class PatternDetector:
    """Detecta Área Funcional usando padrões multi-camadas"""
    
    def __init__(self):
        self.confidence_threshold = 0.7
        self.patterns = self._build_patterns()
    
    def detect_functional_area(self, issue, git_data=None):
        """
        Detecta área funcional com confiança.
        
        Entrada:
        - issue: dict com {id, title, description, labels}
        - git_data: dict com commits/branches (opcional)
        
        Saída:
        - {area, confidence, method}  # method: 'title', 'keywords', 'branch', 'history'
        """
        
        # Nível 1: Análise de título [Module](Area)
        area = self._extract_from_title(issue.get('title', ''))
        if area:
            return {'area': area, 'confidence': 1.0, 'method': 'title'}
        
        # Nível 2: Análise de padrões de palavras-chave
        area, conf = self._detect_by_keywords(issue)
        if conf >= self.confidence_threshold:
            return {'area': area, 'confidence': conf, 'method': 'keywords'}
        
        # Nível 3: Análise de branch (se git_data disponível)
        if git_data:
            area, conf = self._detect_by_branch(issue, git_data)
            if conf >= self.confidence_threshold:
                return {'area': area, 'confidence': conf, 'method': 'branch'}
        
        # Nível 4: Análise de histórico (issues semelhantes)
        area, conf = self._detect_by_history(issue)
        if conf >= 0.8:  # Threshold mais alto para história
            return {'area': area, 'confidence': conf, 'method': 'history'}
        
        # Nenhuma detecção confiável
        return {'area': 'Não Identificado', 'confidence': 0.0, 'method': 'none'}
    
    def _extract_from_title(self, title):
        """[Module](Area) - já existente"""
        match = re.search(r'\]\(?([^)]+)\)?', title)
        return match.group(1).strip() if match else None
    
    def _detect_by_keywords(self, issue):
        """Análise de palavras-chave no título e descrição"""
        title = (issue.get('title', '') + ' ' + issue.get('description', '')).lower()
        labels = ' '.join([l.get('name', '').lower() for l in issue.get('labels', [])])
        content = f"{title} {labels}"
        
        best_match = None
        best_score = 0
        
        for area, patterns in self.patterns.items():
            score = 0
            for keyword in patterns['keywords']:
                if keyword in content:
                    score += 1
            
            if score > 0:
                normalized = score / len(patterns['keywords'])
                if normalized > best_score:
                    best_score = normalized
                    best_match = area
        
        return best_match, best_score
    
    def _detect_by_branch(self, issue, git_data):
        """Análise de branches relacionados"""
        # Procurar por branches com padrão hotfix/*, feature/*, bugfix/*
        # Correlacionar com commits que mencionam issue ID
        pass
    
    def _detect_by_history(self, issue):
        """Análise de histórico de issues semelhantes"""
        # Procurar por issues com títulos/descrições similares
        # Usar similarity matching (edit distance)
        pass
    
    def _build_patterns(self):
        """Constrói dicionário de padrões por área"""
        return {
            'Sincronização de Dados': {
                'keywords': ['sync', 'sincronização', 'replica', 'replicação', 'mirror'],
                'confidence': 0.9
            },
            'Integração': {
                'keywords': ['integration', 'integração', 'connect', 'webhook', 'api'],
                'confidence': 0.85
            },
            'Validação': {
                'keywords': ['validate', 'validação', 'validate', 'schema', 'contract'],
                'confidence': 0.8
            },
            'Conformidade': {
                'keywords': ['compliance', 'conformidade', 'legal', 'audit', 'auditoria'],
                'confidence': 0.95
            },
            'Performance': {
                'keywords': ['performance', 'desempenho', 'slow', 'lento', 'optimize'],
                'confidence': 0.8
            },
            # ... mais áreas
        }
```

### 2️⃣ MÓDULO: PRMRLinker

```python
# novo arquivo: pr_mr_linker.py

class PRMRLinker:
    """Relaciona issues com seus PRs/MRs no GitLab"""
    
    def __init__(self, git_data):
        self.git_data = git_data
        self.pr_mr_cache = {}
    
    def link_issue_to_pr_mr(self, issue_id):
        """
        Encontra PRs/MRs relacionados a uma issue.
        
        Estratégias:
        1. Mencão direta em corpo (closes #ID, fixes #ID)
        2. Branch associada (feature/issue-ID)
        3. Commit message contendo ID
        4. Labels relacionadas
        """
        
        # Estratégia 1: Procurar em commits por menção de issue
        related_prs = self._search_in_commits(issue_id)
        if related_prs:
            return related_prs
        
        # Estratégia 2: Procurar branches com padrão
        related_prs = self._search_in_branches(issue_id)
        if related_prs:
            return related_prs
        
        return []
    
    def _search_in_commits(self, issue_id):
        """Procura commits mencionando issue ID"""
        commits = self.git_data.get('commits', [])
        related = [c for c in commits if f"#{issue_id}" in c.get('mensagem', '')]
        return related
    
    def _search_in_branches(self, issue_id):
        """Procura branches com padrão issue-ID"""
        branches = self.git_data.get('branches', [])
        patterns = [f"issue-{issue_id}", f"#{issue_id}", f"-{issue_id}"]
        return [b for b in branches if any(p in b.get('nome', '') for p in patterns)]
```

### 3️⃣ MÓDULO: FunctionalAreaEnricher

```python
# atualização em process_gitlab_issues_v2.py

def enrich_functional_area(issue, git_data=None):
    """
    Enriquece "Área Funcional" com detecção inteligente.
    
    Lógica:
    1. Se título contém (Area) → usar diretamente
    2. Senão → executar PatternDetector
    3. Se confiança < 0.7 → marcar como "Revisão Necessária"
    4. Se confiança >= 0.7 → preencher automaticamente
    """
    
    # Tentar extrair de título
    area = extract_functional_area(issue.get('title', ''))
    if area and area != '':
        return {
            'value': area,
            'confidence': 1.0,
            'source': 'title',
            'flag': None
        }
    
    # Tentar detectar por padrões
    detector = PatternDetector()
    detection = detector.detect_functional_area(issue, git_data)
    
    result = {
        'value': detection['area'],
        'confidence': detection['confidence'],
        'source': detection['method'],
        'flag': None
    }
    
    # Flag se baixa confiança
    if detection['confidence'] < 0.7:
        result['flag'] = '⚠️ Revisar'
    
    return result
```

### 4️⃣ INTEGRAÇÃO COM PIPELINE

```python
# em pipeline_maestro.py - linha ~170

def processar_issues_excel(self, issues):
    """Versão expandida com padrão detection"""
    
    # Carregar dados Git para análise de branch
    git_data = self._load_git_data()
    
    # Enriquecer cada issue
    enriched_issues = []
    for issue in issues:
        enriched = self._enrich_issue_data(issue, git_data)
        enriched_issues.append(enriched)
    
    # Processar com dados enriquecidos
    result = process_issues(
        excel_file=str(self.excel_output),
        issues=enriched_issues,
        enriched=True  # flag para usar dados expandidos
    )
    
    return result

def _enrich_issue_data(self, issue, git_data):
    """Enriquece com detecção de padrões"""
    from pattern_detector import PatternDetector
    
    detector = PatternDetector()
    detection = detector.detect_functional_area(issue, git_data)
    
    issue['functional_area_detected'] = detection['area']
    issue['functional_area_confidence'] = detection['confidence']
    issue['functional_area_method'] = detection['method']
    
    return issue
```

### 5️⃣ COLUNA DE CONFIANÇA NO EXCEL

```python
# em process_gitlab_issues_v2.py

# Nova coluna para rastreamento de confiança
def process_issues(excel_file, issues, enriched=False):
    """Processa com coluna de confiança se enriquecido"""
    
    wb = load_workbook(excel_file)
    ws = wb['Dados']
    
    # Se enriquecido, adicionar colunas de meta
    if enriched:
        # Coluna N: Confiança (%)
        # Coluna O: Método de Detecção
        # Coluna P: Flag de Revisão
        
        if ws.max_column < 16:
            # Adicionar headers
            ws.cell(1, 14).value = 'Confiança (%)'
            ws.cell(1, 15).value = 'Método Detecção'
            ws.cell(1, 16).value = 'Flag'
```

---

## 📊 DADOS DE ENTRADA NECESSÁRIOS

Para funcionar corretamente, o sistema precisa de:

```
✅ INPUTS DISPONÍVEIS:
- Issues JSON (já temos: gitlab_issues_raw.json)
- Git data (commits, branches, releases)
- MODULE_MAP atual (14 entradas)

❌ INPUTS A DESCOBRIR:
- Padrões de commit message por área
- Branches associadas a cada área
- Histórico de issues já categorizadas
- Validação manual de 50-100 issues
```

---

## 🎬 PRÓXIMOS PASSOS - SEMANA 1

### Segunda: Implementação PatternDetector
- [ ] Criar `pattern_detector.py` com classe completa
- [ ] Implementar Nível 1 (title extraction)
- [ ] Implementar Nível 2 (keyword detection)
- [ ] Testes unitários básicos

### Terça: Integração com Pipeline
- [ ] Atualizar `pipeline_maestro.py` para carregar PatternDetector
- [ ] Adicionar enriquecimento de dados antes de process_issues
- [ ] Testar com 100 issues reais

### Quarta: Validação e Ajustes
- [ ] Analisar resultados de detecção
- [ ] Ajustar thresholds de confiança
- [ ] Calibrar keywords para cada área

### Quinta-Sexta: Testes Completos
- [ ] Teste completo com pipeline (2 repos)
- [ ] Gerar relatório de qualidade de detecção
- [ ] Documentação de padrões descobertos

---

## 📈 MÉTRICAS DE SUCESSO

```
OBJETIVOS:
- 80%+ de issues com "Área Funcional" detectada automaticamente
- 90%+ confiança para issues com área explícita no título
- <10% necessitando revisão manual

RASTREAMENTO:
- % de issues com área preenchida
- Distribuição de confiança por método
- Issues flagged para revisão
```

---

## ⚙️ CONFIGURAÇÕES RECOMENDADAS

```python
# Em process_gitlab_issues_v2.py

PATTERN_DETECTION_CONFIG = {
    'enabled': True,
    'confidence_threshold': 0.7,     # Preencher automaticamente se >= 70%
    'review_threshold': 0.5,          # Flag para revisão se < 70%
    'methods': ['title', 'keywords', 'branch', 'history'],
    'max_history_distance': 5,        # Usar similaridade até 5 edições
}

ENRICHMENT_OUTPUT = {
    'column_confidence': 'N',         # Coluna de confiança (0-100%)
    'column_method': 'O',              # Coluna de método
    'column_flag': 'P',                # Coluna de flag
}
```

---

## 🔍 VALIDAÇÃO PRÉ-DEPLOYMENT

Antes de ativar no pipeline:

```powershell
# 1. Teste de imports
python -c "from pattern_detector import PatternDetector; print('OK')"

# 2. Teste com amostra
python -m pytest test_pattern_detector.py -v

# 3. Teste de integração
cd D:\MGI-Relatórios
python pipeline_maestro.py --test --first-100-issues

# 4. Verificar resultados
# - Abrir Dashboard_Contratos_v2.xlsx
# - Verificar coluna "Área Funcional"
# - Contar % de preenchimento
# - Revisar flags
```

---

## 📞 SUPORTE

Se precisar de ajustes:
1. Adicionar novo padrão para área X
2. Ajustar threshold de confiança
3. Modificar estratégia de detecção
4. Adicionar nova fonte de dados

Todos são mudanças em `pattern_detector.py` apenas.

---

**Status:** 🟢 Pronto para implementação  
**Estimativa:** 3-4 dias de desenvolvimento + 1 dia de testes  
**Risco:** Baixo (módulos isolados, fácil rollback)
