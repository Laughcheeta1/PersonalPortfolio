# PersonalPortfolio Monorepo

This repository now contains:

- `frontend/`: React + TypeScript + Vite app deployed to GitHub Pages.
- `lambdas/`: AWS SAM application with Python Lambda functions.

## Repository Layout

```text
.
├── frontend/
├── lambdas/
└── .github/workflows/
```

## Frontend

From `frontend/`:

```bash
bun install
bun run dev
```

Build:

```bash
bun run build
```

Detailed frontend notes are in `frontend/README.md`.

## Lambda (Chatbot)

The chatbot Lambda is defined in `lambdas/template.yaml` and its handler is at:

- `lambdas/functions/chatbot/app.py`

Build locally (requires AWS SAM CLI):

```bash
cd lambdas
sam build
```

Deploy manually:

```bash
sam deploy --guided
```

## GitHub Actions

- `deploy.yaml`: builds and deploys `frontend/` to GitHub Pages.
- `deploy-lambda.yaml`: builds and deploys the SAM stack in `lambdas/`.

For Lambda deployment workflow, set repository configuration:

- `secrets.AWS_ROLE_TO_ASSUME`: IAM role ARN for GitHub OIDC deployment.
- Optional `vars.AWS_REGION` (default `us-east-1`).
- Optional `vars.SAM_STACK_NAME` (default `personal-portfolio-chatbot`).
