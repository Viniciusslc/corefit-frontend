# Corefit - Pre-Deploy Checklist

## Objetivo

Fechar a camada de preparacao para producao sem quebrar o que ja foi construido no frontend.

## Fluxos para validar manualmente

- Cadastro em `/register`
- Login com email e senha em `/login`
- Recuperacao de senha em `/forgot-password`
- Redefinicao de senha em `/reset-password?token=...`
- Dashboard free em `/dashboard`
- Lista de treinos em `/trainings`
- Inicio de treino e continuidade em `/workouts/active`
- Historico em `/workouts`
- Detalhe do treino em `/workouts/[id]`
- Perfil em `/profile`
- Planos em `/planos`
- Admin em `/admin`

## Variaveis de ambiente para conferir

### Frontend

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Backend

- `RESEND_API_KEY`
- `EMAIL_FROM`
- variaveis do Stripe usadas no billing real

## Billing / premium

- Validar `/billing/status`
- Validar criacao de checkout em `/billing/checkout-session`
- Validar portal em `/billing/portal`
- Confirmar que contas internas/admin nao entram nas metricas de receita
- Confirmar que conta free continua funcional sem checkout configurado

## Seguranca / limpeza

- Garantir que nenhum bloco de diagnostico local esteja visivel por padrao
- Garantir que nenhuma credencial local hardcoded permaneceu em telas publicas
- Garantir que mensagens de erro expostas ao usuario estejam legiveis e sem referencia a localhost

## UI / acabamento

- Conferir consistencia visual entre dashboard, login, register, profile e planos
- Conferir hover, glow, espacos e cards no desktop
- Conferir versao mobile das rotas principais
- Conferir que nao existem textos truncados ou componentes sobrepostos

## Validacao tecnica

- Rodar `npm run build`
- Rodar `npm run check:env`
- Rodar `npm run smoke`
- Em ambiente de producao, rodar `npm run release:check`
- Rodar testes do backend, se existirem
- Conferir integracao real frontend + backend + Docker no ambiente de deploy

## Readiness operacional

- Validar `GET /api/health`
- Validar `GET /api/ready`
- Confirmar que `/api/ready` responde `503` quando o core nao estiver pronto
- Confirmar que `fullProductionReady` so fica `true` com backend publico e Google OAuth configurados

## Observacoes

- O fluxo de forgot/reset password so fica completo em producao quando email transacional estiver configurado
- O login com Google depende de `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no frontend e das credenciais corretas no backend
- O billing premium depende da configuracao real do Stripe e webhook
- As rotas legadas `nova-*` e `teste/*` devem ser tratadas apenas como compatibilidade, nao como superficie principal do produto
