# Lambdas

AWS SAM project for backend Lambda functions.

## Chatbot Function

- Function logical ID: `ChatbotLambda`
- Handler: `src/chatbot/app.lambda_handler`
- Runtime: Python 3.13
- Endpoint type: API Gateway (`POST /chat`)

## Local Commands

```bash
sam build
GROQ_API_KEY=your_key sam local start-api
```

This runs a local API Gateway emulator, so the chatbot endpoint is available at:

```text
http://127.0.0.1:3000/chat
```

## Local Env File

Expected local env vars are in:

- `lambdas/.env.example`

Create your local file:

```bash
cp .env.example .env
```

Then set your values in `lambdas/.env` (at minimum one provider key: `GROQ_API_KEY` or `OPENAI_API_KEY`).

When you run Nx targets, the env file is loaded automatically:

```bash
nx build lambdas
nx dev lambdas
```

`nx dev lambdas` starts `sam local start-api` and injects `GROQ_API_KEY` from `.env` into the local Lambda container.

## Deploy

```bash
sam deploy --guided
```
