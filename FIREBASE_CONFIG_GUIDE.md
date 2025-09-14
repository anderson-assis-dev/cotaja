# 🔥 Guia de Configuração Firebase - Cotaja

## ✅ Status Atual

- ✅ Dependências instaladas
- ✅ Pods configurados
- ✅ Arquivos temporários criados
- ✅ App funcionando sem erros
- ⚠️ Firebase precisa ser configurado com projeto real

## 🚀 Próximos Passos

### 1. Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome do projeto: `cotaja-app` (ou outro de sua escolha)
4. Ative Google Analytics (opcional)
5. Aguarde a criação do projeto

### 2. Configurar Android

1. No Firebase Console, clique em "Adicionar app" → Android
2. Package name: `com.cotaja`
3. Baixe o arquivo `google-services.json`
4. **Substitua** o arquivo temporário:
   ```bash
   # Substitua o arquivo em:
   cotaja/android/app/google-services.json
   ```

### 3. Configurar iOS

1. No Firebase Console, clique em "Adicionar app" → iOS
2. Bundle ID: `com.cotaja`
3. Baixe o arquivo `GoogleService-Info.plist`
4. **Substitua** o arquivo temporário:
   ```bash
   # Substitua o arquivo em:
   cotaja/ios/cotaja/GoogleService-Info.plist
   ```

### 4. Ativar Cloud Messaging

1. No Firebase Console, vá para **Build** → **Cloud Messaging**
2. Clique em "Começar"
3. Para iOS: Configure APNs (Apple Push Notification service)
   - Upload do certificado APNs ou chave de autenticação
4. Para Android: Configuração automática

### 5. Configurar Backend

1. No Firebase Console, vá para **Project Settings** → **Service accounts**
2. Clique em **Generate new private key**
3. Baixe o arquivo JSON
4. Coloque em: `cotaja-backend/storage/app/firebase/service-account.json`
5. Configure o `.env`:
   ```env
   FIREBASE_PROJECT_ID=seu-project-id-aqui
   FIREBASE_CREDENTIALS=storage/app/firebase/service-account.json
   ```

### 6. Testar Configuração

Após configurar os arquivos reais:

1. **Limpar cache:**
   ```bash
   cd cotaja
   npx react-native start --reset-cache
   ```

2. **Reinstalar pods (iOS):**
   ```bash
   cd ios && pod install
   ```

3. **Rebuild do app:**
   ```bash
   # Android
   npx react-native run-android
   
   # iOS
   npx react-native run-ios
   ```

### 7. Verificar Funcionamento

Após configurar, você deve ver nos logs:
```
🔔 Inicializando Push Notifications...
📱 Solicitando permissões...
✅ Permissões concedidas
🔑 Novo token FCM obtido: abc123...
📤 Enviando token para backend: abc123...
✅ Token FCM enviado para backend com sucesso
✅ Push Notifications inicializadas com sucesso
```

## 🧪 Testar Notificações

### 1. Via Firebase Console

1. Vá para **Cloud Messaging** → **Send your first message**
2. Título: "Teste"
3. Texto: "Notificação de teste"
4. Target: "Single device"
5. FCM token: (copie do log do app)
6. Envie a mensagem

### 2. Via Backend

Crie uma demanda no app e verifique se providers da categoria recebem notificações.

## ⚠️ Problemas Comuns

### Token não é gerado
- Verificar permissões de notificação
- Verificar se os arquivos de configuração estão corretos
- Testar em dispositivo real (não simulador)

### Notificações não chegam
- Verificar se o app está em background
- Verificar configuração APNs (iOS)
- Verificar logs do Firebase Console

### Erro no backend
- Verificar credenciais do service account
- Verificar se o project_id está correto
- Verificar logs em `storage/logs/laravel.log`

## 📱 Arquivos Importantes

- `cotaja/android/app/google-services.json` - Configuração Android
- `cotaja/ios/cotaja/GoogleService-Info.plist` - Configuração iOS
- `cotaja-backend/storage/app/firebase/service-account.json` - Credenciais backend
- `cotaja-backend/.env` - Variáveis de ambiente

## 🎯 Resultado Final

Após configurar corretamente:
- ✅ Notificações push funcionando
- ✅ Tokens FCM salvos no backend
- ✅ Providers recebem notificações de novas demandas
- ✅ Clientes recebem notificações de novas propostas
- ✅ Sistema completo de push notifications

---

**Nota:** Os arquivos temporários criados permitem que o app funcione durante o desenvolvimento. Substitua pelos arquivos reais do Firebase quando estiver pronto para testar as notificações.

