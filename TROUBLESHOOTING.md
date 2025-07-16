# 🔧 Guia de Troubleshooting - Criação de Pedidos

## ❌ Problema: "Dados inválidos" ao criar pedido

### 🔍 Passos para Diagnosticar:

#### 1. **Verificar se o Backend está rodando**
```bash
cd cotaja-backend
php artisan serve
```

#### 2. **Verificar se as Migrations foram executadas**
```bash
cd cotaja-backend
php artisan migrate:status
```

Se houver migrations pendentes:
```bash
php artisan migrate
```

#### 3. **Verificar logs do Laravel**
```bash
cd cotaja-backend
tail -f storage/logs/laravel.log
```

#### 4. **Testar a API diretamente**
```bash
# Testar criação de pedido via curl
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "title": "Teste",
    "description": "Descrição teste",
    "category": "Limpeza",
    "budget": 100,
    "deadline": "7 dias",
    "address": "Rua teste, 123"
  }'
```

### 🛠️ Soluções Comuns:

#### **Problema 1: Migrations não executadas**
```bash
cd cotaja-backend
php artisan migrate:fresh
```

#### **Problema 2: URL da API incorreta**
No arquivo `src/services/api.ts`, ajuste a URL conforme seu ambiente:

```typescript
// Para Android Emulator
const API_BASE_URL = 'http://10.0.2.2:8000/api';

// Para iOS Simulator
const API_BASE_URL = 'http://localhost:8000/api';

// Para dispositivo físico (substitua pelo IP do seu computador)
const API_BASE_URL = 'http://192.168.1.100:8000/api';
```

#### **Problema 3: Token de autenticação inválido**
- Faça logout e login novamente
- Verifique se o token está sendo salvo corretamente

#### **Problema 4: Campos obrigatórios não preenchidos**
Verifique se todos os campos estão sendo enviados:
- title
- description
- category
- budget (deve ser número)
- deadline
- address

### 🔍 Debug no Frontend:

Adicione logs no `CreateOrderScreen.tsx`:

```typescript
const handleSubmit = async () => {
  console.log('Dados do formulário:', {
    title,
    description,
    category,
    budget,
    deadline,
    address
  });
  
  // ... resto do código
};
```

### 🔍 Debug no Backend:

Os logs já estão configurados no `OrderController.php`. Verifique:
```bash
cd cotaja-backend
tail -f storage/logs/laravel.log
```

### 📱 Teste Rápido:

1. **Inicie o backend:**
   ```bash
   cd cotaja-backend
   php artisan serve
   ```

2. **Execute as migrations:**
   ```bash
   php artisan migrate
   ```

3. **Teste a conexão:**
   ```bash
   node test_backend.js
   ```

4. **Tente criar um pedido simples:**
   - Título: "Teste"
   - Descrição: "Descrição teste"
   - Categoria: "Limpeza"
   - Orçamento: 100
   - Prazo: "7 dias"
   - Endereço: "Rua teste, 123"

### 📞 Se o problema persistir:

1. Verifique os logs do console do React Native
2. Verifique os logs do Laravel
3. Teste a API via Postman ou curl
4. Verifique se o usuário está autenticado
5. Verifique se o usuário tem perfil de cliente

### 🎯 Campos Obrigatórios:

- ✅ **title**: string (máx 255 caracteres)
- ✅ **description**: string
- ✅ **category**: string (máx 100 caracteres)
- ✅ **budget**: número (mín 0)
- ✅ **deadline**: string (máx 100 caracteres)
- ✅ **address**: string
- ✅ **attachments**: opcional (arquivos até 10MB) 