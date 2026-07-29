# Política de segurança

## Versões suportadas

| Versão | Suportada |
|--------|-----------|
| `main` (deploy em produção) | Sim |
| Outras branches / tags antigas | Não |

Correções de segurança são aplicadas na branch `main` e publicadas via deploy na Vercel.

## Reportar uma vulnerabilidade

Se você encontrar um problema de segurança neste repositório ou no ambiente em produção:

1. **Não** abra uma issue pública com detalhes exploráveis.
2. Envie um e-mail para **mariahilmar@gmail.com** com:
   - descrição do problema;
   - passos para reproduzir (se aplicável);
   - impacto estimado;
   - versão/commit ou URL afetada.
3. Aguarde confirmação de recebimento em até **5 dias úteis**.

## Escopo

Esta política cobre:

- código deste repositório (`kpi-dashboard`);
- rotas de API expostas pelo app (ex.: `/api/revalidate`, exportações, importação);
- autenticação e autorização via Supabase Auth / RLS.

Problemas no **Supabase**, **GitLab** ou no pipeline Python [`kpi-pipeline`](https://github.com/MariaHilmar/kpi-pipeline) devem ser reportados pelo mesmo canal; encaminharemos ao repositório adequado quando necessário.

## O que não incluir no reporte público

- tokens, chaves `service_role`, `REVALIDATE_SECRET` ou credenciais de usuário;
- dumps de banco ou exports com dados pessoais de issues.

## Divulgação responsável

Pedimos um prazo razoável para investigação e correção antes de divulgação pública. Agradecemos reportes de boa-fé.
