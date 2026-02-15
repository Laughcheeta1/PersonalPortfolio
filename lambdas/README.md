# Lambdas

AWS SAM project for backend Lambda functions.

## Chatbot Function

- Function logical ID: `ChatbotFunction`
- Handler: `functions/chatbot/app.lambda_handler`
- Runtime: Python 3.12
- Endpoint type: Lambda Function URL (public, CORS enabled)

## Local Commands

```bash
sam build
sam local start-lambda
```

## Deploy

```bash
sam deploy --guided
```
