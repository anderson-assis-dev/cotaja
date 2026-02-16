# Sistema de Toast

Sistema de notificações toast implementado seguindo as melhores práticas de UI/UX do app.

## Características

- ✅ **Animações suaves** - Entrada e saída com animações fluidas
- ✅ **Design consistente** - Segue o padrão visual do app
- ✅ **Tipos de mensagem** - Success, Error, Warning, Info
- ✅ **Auto-hide** - Desaparece automaticamente após duração configurável
- ✅ **Safe Area** - Respeita notch e áreas seguras do dispositivo
- ✅ **Responsivo** - Adapta-se a diferentes tamanhos de tela

## Uso

### Importar o hook

```tsx
import { useToast } from '../contexts/ToastContext';
```

### Usar no componente

```tsx
function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleAction = async () => {
    try {
      // sua lógica aqui
      showSuccess('Operação realizada com sucesso!');
    } catch (error) {
      showError('Erro ao realizar operação');
    }
  };

  return (
    // seu JSX
  );
}
```

## Métodos disponíveis

### showSuccess(message, duration?)
Mostra toast de sucesso (verde)
```tsx
showSuccess('Login realizado com sucesso!', 3000);
```

### showError(message, duration?)
Mostra toast de erro (vermelho)
```tsx
showError('Email ou senha inválidos', 4000);
```

### showWarning(message, duration?)
Mostra toast de aviso (laranja)
```tsx
showWarning('Atenção: esta ação não pode ser desfeita');
```

### showInfo(message, duration?)
Mostra toast informativo (azul)
```tsx
showInfo('Nova atualização disponível');
```

### showToast(config)
Método genérico para configuração customizada
```tsx
showToast({
  message: 'Mensagem customizada',
  type: 'success',
  duration: 5000
});
```

## Cores e Ícones

| Tipo    | Cor       | Ícone        |
|---------|-----------|--------------|
| Success | `#10b981` | check-circle |
| Error   | `#ef4444` | error        |
| Warning | `#f59e0b` | warning      |
| Info    | `#3b82f6` | info         |

## Duração padrão

- **4 segundos** (4000ms) para todas as mensagens
- Pode ser customizada passando o parâmetro `duration`

## Implementado em

- ✅ LoginScreen - Erros de autenticação
- ✅ RegisterScreen - Erros de cadastro
- ✅ ForgotPasswordScreen - Confirmação de envio
- ✅ AuthContext - Erros de conexão (ECONNREFUSED, NETWORK_ERROR, TIMEOUT)

## Estrutura de arquivos

```
src/
  components/
    Toast.tsx          # Componente visual do toast
  contexts/
    ToastContext.tsx   # Contexto e provider do toast
```
