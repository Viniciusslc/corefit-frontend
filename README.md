# Corefit Frontend

Frontend Next.js do Corefit com landing, auth renovado, dashboard free, camada de planos, admin e fluxo de treino.

## Stack

- Next.js 16
- React 18
- Tailwind utilities + CSS proprio do projeto
- Framer Motion
- Lucide React

## Rodando localmente

```bash
npm install
npm run dev
```

App local padrao:

- `http://localhost:3001`

## Variaveis de ambiente

Use `.env.example` como base:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Para producao completa, use `.env.production.example` como referencia.

## Rotas principais

### Publicas

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/planos`
- `/funcionalidades`
- `/sobre`

### Privadas

- `/dashboard`
- `/trainings`
- `/trainings/ai`
- `/workouts`
- `/workouts/active`
- `/profile`
- `/admin`

## O que o frontend ja suporta

- login local com JWT salvo em `localStorage`
- login com Google via popup + code exchange no backend
- cadastro com meta semanal
- forgot/reset password
- dashboard free com hero, KPIs e leitura de plano
- CTA de upgrade para premium
- pagina de planos integrada com `billing/status`, checkout e portal
- profile com leitura de assinatura e troca de senha
- admin BI com operacao manual de usuarios

## Dependencias externas para producao

Mesmo com a UI pronta, estes itens precisam estar conectados para o fluxo completo:

- backend publicado e acessivel em `NEXT_PUBLIC_API_URL`
- Google OAuth configurado com dominio correto
- Stripe real para checkout/portal/webhook
- Resend configurado para emails de recuperacao

## Build

```bash
npm run build
```

## Readiness e smoke

Checks locais e de producao:

```bash
npm run check:env
npm run smoke
```

Para validar exigencia de producao completa:

```bash
npm run check:env:prod
npm run smoke:prod
npm run release:check
```

Leituras operacionais expostas pelo app:

- `GET /api/health`
- `GET /api/ready`

## Observacoes

- As rotas antigas `nova-*`, `teste/*` e `/ai-coach` ficaram apenas como compatibilidade via redirect.
- A rota `/planos` ja entende estado do checkout e readiness de billing.
- O app foi preparado para manter a camada free funcional mesmo quando o billing ainda nao esta conectado.
- O app possui `global-error` para falhas inesperadas em runtime.
