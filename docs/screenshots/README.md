# Screenshots

Imagens de referência para o README e documentação do portfólio.

| Arquivo | Descrição |
|---------|-----------|
| `login.png` | Tela de login (GovBR DS) — capturada de produção |

## Atualizar capturas

O dashboard autenticado exige login. Para adicionar prints das páginas internas (Executivo, Fluxo, etc.):

1. Acesse o ambiente com credenciais válidas.
2. Use viewport 1280×800 para consistência.
3. Salve em `docs/screenshots/` com nome descritivo (ex.: `executivo.png`, `fluxo.png`).
4. Referencie no [README](../README.md).

Exemplo com Playwright (página pública):

```powershell
npx playwright screenshot https://web-mgi-delog.vercel.app/login docs/screenshots/login.png --viewport-size=1280,800
```
