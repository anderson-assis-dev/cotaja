# 📮 Guia de Uso do Postman - API Cotaja

## 🚀 Como Importar a Coleção

1. **Abra o Postman**
2. **Clique em "Import"**
3. **Selecione o arquivo `postman_collection.json`**
4. **A coleção será importada automaticamente**

## ⚙️ Configuração Inicial

### 1. **Configure as Variáveis de Ambiente**

Na coleção, você encontrará duas variáveis:
- `base_url`: URL base da API (padrão: `http://localhost:8000/api`)
- `auth_token`: Token de autenticação (será preenchido automaticamente)

### 2. **Inicie o Backend**

```bash
cd cotaja-backend
php artisan serve
```

## 🔐 Fluxo de Autenticação

### **Passo 1: Registrar Usuário**
1. Execute a requisição **"Register"** na pasta **"Auth"**
2. Use os dados de exemplo ou crie um novo usuário
3. **Copie o token** da resposta

### **Passo 2: Configurar Token**
1. **Clique na coleção "Cotaja API"**
2. **Vá na aba "Variables"**
3. **Cole o token** na variável `auth_token`

### **Passo 3: Definir Tipo de Perfil**
1. Execute **"Update Profile Type"**
2. Use `"client"` para testar criação de pedidos
3. Use `"provider"` para testar envio de propostas

## 📋 Testando o Fluxo Completo

### **Cenário 1: Cliente Criando Pedido**

#### **1. Registrar Cliente**
```json
{
  "name": "Maria Silva",
  "email": "maria@teste.com",
  "phone": "(11) 88888-8888",
  "password": "123456",
  "password_confirmation": "123456"
}
```

#### **2. Fazer Login**
```json
{
  "email": "maria@teste.com",
  "password": "123456"
}
```

#### **3. Definir Perfil como Cliente**
```json
{
  "profile_type": "client"
}
```

#### **4. Criar Pedido**
Use a requisição **"Create Order"** com os dados:
- **title**: "Pintura de apartamento"
- **description**: "Preciso pintar um apartamento..."
- **category**: "Pintura"
- **budget**: "3000"
- **deadline**: "15 dias"
- **address**: "Rua das Flores, 123..."

#### **5. Ver Pedidos Criados**
Execute **"Get My Orders"** para ver os pedidos criados

### **Cenário 2: Prestador Enviando Proposta**

#### **1. Registrar Prestador**
```json
{
  "name": "João Pintor",
  "email": "joao@teste.com",
  "phone": "(11) 77777-7777",
  "password": "123456",
  "password_confirmation": "123456"
}
```

#### **2. Fazer Login**
```json
{
  "email": "joao@teste.com",
  "password": "123456"
}
```

#### **3. Definir Perfil como Prestador**
```json
{
  "profile_type": "provider"
}
```

#### **4. Ver Pedidos Disponíveis**
Execute **"Get Available Orders"** para ver pedidos abertos

#### **5. Enviar Proposta**
Use **"Create Proposal"** com os dados:
```json
{
  "order_id": 1,
  "price": 2800,
  "deadline": "12 dias",
  "description": "Tenho experiência em pintura..."
}
```

#### **6. Ver Propostas Enviadas**
Execute **"Get My Proposals"** para ver suas propostas

### **Cenário 3: Cliente Aceitando Proposta**

#### **1. Ver Detalhes do Pedido**
Execute **"Get Order Details"** (ID: 1)

#### **2. Aceitar Proposta**
Execute **"Accept Proposal"** (ID da proposta: 1)

## 🧪 Testes Específicos

### **Teste de Validação - Campos Obrigatórios**
Tente criar um pedido sem campos obrigatórios:

```json
{
  "title": "",
  "description": "",
  "category": "",
  "budget": "",
  "deadline": "",
  "address": ""
}
```

**Resultado esperado**: Erro 422 com lista de campos inválidos

### **Teste de Permissão - Prestador Criando Pedido**
1. Faça login como prestador
2. Tente criar um pedido
3. **Resultado esperado**: Erro 403 - "Apenas clientes podem criar pedidos"

### **Teste de Proposta Duplicada**
1. Envie uma proposta para um pedido
2. Tente enviar outra proposta para o mesmo pedido
3. **Resultado esperado**: Erro 400 - "Você já enviou uma proposta para este pedido"

## 🔍 Debug e Troubleshooting

### **Verificar Status do Backend**
```bash
curl http://localhost:8000
```

### **Verificar Logs do Laravel**
```bash
cd cotaja-backend
tail -f storage/logs/laravel.log
```

### **Testar Autenticação**
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456"}'
```

## 📊 Respostas Esperadas

### **Sucesso (201)**
```json
{
  "success": true,
  "message": "Pedido criado com sucesso!",
  "data": {
    "id": 1,
    "title": "Pintura de apartamento",
    "description": "...",
    "category": "Pintura",
    "budget": "3000.00",
    "deadline": "15 dias",
    "address": "...",
    "status": "open",
    "client_id": 1,
    "created_at": "2024-01-01T00:00:00.000000Z",
    "updated_at": "2024-01-01T00:00:00.000000Z"
  }
}
```

### **Erro de Validação (422)**
```json
{
  "success": false,
  "message": "Dados inválidos",
  "errors": {
    "title": ["O campo title é obrigatório."],
    "budget": ["O campo budget deve ser um número."]
  }
}
```

### **Erro de Permissão (403)**
```json
{
  "success": false,
  "message": "Apenas clientes podem criar pedidos"
}
```

## 🎯 Dicas Importantes

1. **Sempre configure o token** após fazer login
2. **Use IDs corretos** nas requisições (substitua "1" pelos IDs reais)
3. **Verifique o status HTTP** das respostas
4. **Monitore os logs** do Laravel para debug
5. **Teste um cenário por vez** para facilitar o debug

## 🚨 Problemas Comuns

### **Erro 500 - Internal Server Error**
- Verifique se as migrations foram executadas
- Verifique os logs do Laravel
- Reinicie o servidor Laravel

### **Erro 401 - Unauthorized**
- Verifique se o token está configurado
- Faça login novamente
- Verifique se o token não expirou

### **Erro 404 - Not Found**
- Verifique se a URL está correta
- Verifique se o servidor está rodando
- Verifique se as rotas estão registradas

### **Erro 422 - Validation Error**
- Verifique se todos os campos obrigatórios estão preenchidos
- Verifique os tipos de dados (budget deve ser número)
- Verifique os limites de caracteres 