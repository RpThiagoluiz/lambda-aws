# Serverless AWS Lambda - Customer Service

Serviço Lambda para consulta de clientes via CPF usando PostgreSQL RDS, desenvolvido com Clean Architecture e TypeScript.

## 🏗️ Arquitetura

- **Runtime**: Node.js 18.x
- **Framework**: Serverless Framework v3
- **Database**: PostgreSQL RDS (Amazon Aurora)
- **Language**: TypeScript
- **Pattern**: Clean Architecture
- **API**: REST com query parameters

## 📁 Estrutura do Projeto

```
src/
├── application/
│   └── use-cases/
│       └── get-customer.use-case.ts     # Regras de negócio
├── domain/
│   ├── entities/
│   │   └── customer.entity.ts           # Entidade Customer
│   ├── repositories/
│   │   └── customer.repository.interface.ts
│   ├── dtos/
│   │   └── get-customer-response.dto.ts
│   └── errors/
│       └── customer.errors.ts
├── infrastructure/
│   └── repositories/
│       └── postgresql-customer.repository.ts # Implementação PostgreSQL
├── presentation/
│   └── controllers/
│       └── get-customer.controller.ts   # Controller HTTP
├── utils/
│   └── cpf-validator.ts                 # Validação de CPF
└── handler.ts                           # Lambda handler
```

## 🚀 Setup e Deploy

### 1. Pré-requisitos

- Node.js 18+
- AWS CLI configurado
- Serverless Framework

### 2. Instalação

```bash
npm install
```

### 3. Configuração

O projeto usa duas configurações:

- **`serverless.yml`**: Desenvolvimento local
- **`serverless-prod.yml`**: Deploy em produção

### 4. Deploy

```bash
# Deploy via GitHub Actions (recomendado)
git push origin main

# Deploy manual (local)
export AWS_ROLE_ARN="arn:aws:iam::ACCOUNT:role/LabRole"
export DB_HOST="your-rds-endpoint"
export DB_NAME="customers_db"
export DB_USER="postgres"
export DB_PASSWORD="your-password"

sls deploy --stage prod --config serverless-prod.yml
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Build TypeScript
npm run build

# Package local
npx sls package --stage dev
```

## 📡 API

### Endpoint: GET /customers

**Query Parameter:**

- `cpf` (required): CPF do cliente (com ou sem formatação)

**Exemplo de Requisição:**

```bash
curl "https://API_GATEWAY_URL/customers?cpf=12345678901"
curl "https://API_GATEWAY_URL/customers?cpf=123.456.789-01"
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "id": "123",
    "cpf": "12345678901",
    "name": "João Silva",
    "email": "joao@email.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Resposta de Erro (400):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CPF",
    "message": "Invalid CPF format: 123"
  }
}
```

**Resposta Cliente Não Encontrado (404):**

```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer with CPF 12345678901 not found"
  }
}
```

## 🔗 Integração com RDS

Este serviço conecta-se ao PostgreSQL RDS deployado pelo repositório [`rds-postgrels`](../rds-postgrels/).

**Variáveis de Ambiente (Secrets):**

- `DB_HOST`: Endpoint do RDS
- `DB_NAME`: Nome do banco
- `DB_USER`: Usuário PostgreSQL
- `DB_PASSWORD`: Senha do banco

## 🧪 Como Testar o Sistema Completo

### 1. Verificar RDS Deploy

```bash
# No repositório rds-postgrels
cd ../rds-postgrels
git log --oneline -5  # Verificar último deploy
```

### 2. Verificar Lambda Deploy

```bash
# Verificar no AWS Console ou
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `serverless-aws-lambda-prod`)]'
```

### 3. Obter URL da API

A URL completa será algo como:
```
https://abc123def.execute-api.us-east-1.amazonaws.com/prod/customers
```

**⚠️ IMPORTANTE:** Sempre incluir `/customers` no final da URL base!

```bash
# ❌ ERRADO - Missing Authentication Token
https://abc123def.execute-api.us-east-1.amazonaws.com/prod?cpf=12345678901

# ✅ CORRETO - Inclui /customers
https://abc123def.execute-api.us-east-1.amazonaws.com/prod/customers?cpf=12345678901
```

### 4. Testar Endpoints

**Teste CPF Válido (dados seeded):**

```bash
curl "https://YOUR_API_URL/customers?cpf=12345678901"
```

**Teste CPF Inválido:**

```bash
curl "https://YOUR_API_URL/customers?cpf=123"
```

**Teste CPF Não Encontrado:**

```bash
curl "https://YOUR_API_URL/customers?cpf=99999999999"
```

**Teste com Formatação:**

```bash
curl "https://YOUR_API_URL/customers?cpf=123.456.789-01"
```

## 🔄 CI/CD

Deploy automático via GitHub Actions:

1. **Trigger**: Push para `main`
2. **Build**: Compila TypeScript
3. **Deploy**: Usa `serverless-prod.yml`
4. **Secrets**: AWS credentials + DB config

## 📚 Conceitos Estudados

### Clean Architecture

- **Domain**: Entidades e regras de negócio
- **Application**: Use cases
- **Infrastructure**: Repositórios e conexões externas
- **Presentation**: Controllers e handlers

### Validação de CPF

- Algoritmo oficial brasileiro
- Limpeza de formatação
- Validação de dígitos verificadores

### PostgreSQL + Lambda

- Connection pooling
- Environment variables
- Error handling
- SQL parameterizado

### Serverless Framework

- TypeScript plugin
- Multiple configs (dev/prod)
- IAM roles external
- API Gateway integration

## 🐛 Troubleshooting

### Build Errors

```bash
# Limpar cache
rm -rf dist .serverless node_modules
npm install
npm run build
```

### Permission Errors

- Verificar `AWS_ROLE_ARN` secret
- Confirmar LabRole existe
- Checar AWS Academy permissions

### Database Connection

- Verificar RDS endpoint
- Confirmar security groups
- Testar credenciais
