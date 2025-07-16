# 🔧 Guia de Troubleshooting - Problemas de Login

## 🚨 Problema Atual
- Tela fica em branco após tentar fazer login
- Erro aparece depois de alguns segundos

## 🔍 Possíveis Causas e Soluções

### 1. **Backend não está rodando**
```bash
# Verifique se o servidor Laravel está rodando
cd bootstrap
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. **URL da API incorreta**
- ✅ **Corrigido**: Agora detecta automaticamente iOS/Android
- iOS Simulator: `http://localhost:8000/api`
- Android Emulator: `http://10.0.2.2:8000/api`

### 3. **Problemas de CORS**
Verifique se o backend tem CORS configurado:
```php
// bootstrap/config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

### 4. **Token de autenticação inválido**
```bash
# Limpar dados salvos no app
# Vá em Configurações > Apps > Cotaja > Storage > Clear Data
```

### 5. **Problemas de rede**
- Verifique se está conectado à internet
- Teste se consegue acessar `http://localhost:8000` no navegador

## 🧪 Como Testar

### Teste 1: Verificar Backend
```bash
# No terminal, na pasta bootstrap
php artisan serve --host=0.0.0.0 --port=8000
```

### Teste 2: Verificar API no navegador
Abra: `http://localhost:8000/api/test`

### Teste 3: Testar login via Postman
Use a coleção do Postman que criamos para testar o login

### Teste 4: Verificar logs
1. Abra o Metro bundler
2. Pressione `d` para abrir o menu de desenvolvimento
3. Vá em "Debug" para ver os logs do console

## 📱 Logs para Verificar

### No Console do React Native:
```
🔐 Inicializando autenticação...
Token salvo: Não
Usuário salvo: Não
📱 Nenhum token encontrado, usuário não autenticado
✅ Inicialização concluída
```

### Ao tentar login:
```
🔄 Iniciando login...
🔐 Tentando fazer login... { email: 'seu@email.com' }
Request: POST /api/login
```

## 🔧 Soluções Rápidas

### Solução 1: Reiniciar tudo
```bash
# 1. Parar o servidor Laravel (Ctrl+C)
# 2. Parar o Metro bundler (Ctrl+C)
# 3. Limpar cache do React Native
npx react-native start --reset-cache
# 4. Reiniciar o servidor Laravel
cd bootstrap && php artisan serve --host=0.0.0.0 --port=8000
# 5. Reinstalar o app no dispositivo/emulador
```

### Solução 2: Verificar rotas da API
```bash
# No backend, verifique se as rotas estão registradas
cd bootstrap
php artisan route:list --path=api
```

### Solução 3: Testar com usuário válido
Certifique-se de que existe um usuário no banco:
```bash
# Criar usuário de teste
php artisan tinker
User::create(['name' => 'Teste', 'email' => 'teste@teste.com', 'password' => Hash::make('123456')]);
```

## 📞 Próximos Passos

1. **Execute o teste de conexão:**
   ```bash
   node test_connection.js
   ```

2. **Verifique os logs no console do React Native**

3. **Teste o login com credenciais válidas**

4. **Se ainda não funcionar, compartilhe os logs de erro**

## 🆘 Se Nada Funcionar

1. Verifique se o backend está rodando na porta 8000
2. Teste a API no Postman primeiro
3. Verifique se não há firewall bloqueando
4. Tente usar um IP específico em vez de localhost
5. Reinstale o app completamente

---

**💡 Dica**: Sempre verifique os logs do console para identificar exatamente onde está o problema! 