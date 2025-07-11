# Cotaja - Sistema de Leilões de Serviços

Sistema completo de leilões de serviços com backend em Laravel 12 e frontend em React Native.

## Estrutura do Projeto

```
cotaja/
├── cotaja/                 # Frontend React Native
│   ├── src/
│   │   ├── contexts/       # Contextos de estado
│   │   ├── navigation/     # Navegação
│   │   ├── screens/        # Telas da aplicação
│   │   └── services/       # Serviços de API
│   └── ...
└── cotaja-backend/         # Backend Laravel 12
    ├── app/
    │   ├── Http/Controllers/
    │   └── Models/
    ├── database/migrations/
    └── routes/
```

## Configuração do Backend (Laravel 12)

### Pré-requisitos
- PHP 8.2+
- Composer
- SQLite (ou MySQL/PostgreSQL)

### Instalação

1. Navegue para o diretório do backend:
```bash
cd cotaja-backend
```

2. Instale as dependências:
```bash
composer install
```

3. Configure o arquivo .env:
```bash
cp .env.example .env
```

4. Gere a chave da aplicação:
```bash
php artisan key:generate
```

5. Execute as migrações:
```bash
php artisan migrate
```

6. Inicie o servidor:
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

O backend estará disponível em `http://localhost:8000`

## Configuração do Frontend (React Native)

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI

### Instalação

1. Navegue para o diretório do frontend:
```bash
cd cotaja
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm start
```

## Funcionalidades Implementadas

### Backend (Laravel 12)
- ✅ Autenticação com Laravel Sanctum
- ✅ Registro de usuários
- ✅ Login/Logout
- ✅ Atualização de perfil
- ✅ Seleção de tipo de perfil (Cliente/Prestador)
- ✅ API RESTful
- ✅ CORS configurado
- ✅ Validação de dados
- ✅ Hash de senhas

### Frontend (React Native)
- ✅ Contexto de autenticação
- ✅ Tela de registro com validação
- ✅ Tela de login
- ✅ Seleção de perfil
- ✅ Navegação baseada em autenticação
- ✅ Integração com API Laravel
- ✅ Gerenciamento de estado
- ✅ Loading states
- ✅ Tratamento de erros

## Endpoints da API

### Autenticação
- `POST /api/register` - Registrar usuário
- `POST /api/login` - Fazer login
- `POST /api/logout` - Fazer logout (requer autenticação)
- `GET /api/me` - Obter dados do usuário (requer autenticação)
- `PUT /api/profile` - Atualizar perfil (requer autenticação)
- `PUT /api/profile-type` - Atualizar tipo de perfil (requer autenticação)

### Dados do Usuário
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(11) 99999-9999",
  "address": "Rua das Flores, 123",
  "profile_type": "client",
  "created_at": "2024-01-01T00:00:00.000000Z",
  "updated_at": "2024-01-01T00:00:00.000000Z"
}
```

## Fluxo de Autenticação

1. **Registro**: Usuário preenche dados e é registrado no sistema
2. **Seleção de Perfil**: Após registro, usuário escolhe entre Cliente ou Prestador
3. **Login**: Usuário faz login com email e senha
4. **Navegação**: Baseada no tipo de perfil, usuário é direcionado para a interface adequada

## Tecnologias Utilizadas

### Backend
- Laravel 12
- Laravel Sanctum (Autenticação)
- SQLite (Banco de dados)
- PHP 8.4

### Frontend
- React Native
- Expo
- React Navigation
- Axios (HTTP Client)
- NativeWind (Tailwind CSS)
- TypeScript

## Próximos Passos

- [ ] Implementar sistema de leilões
- [ ] Adicionar upload de imagens
- [ ] Implementar notificações push
- [ ] Adicionar sistema de avaliações
- [ ] Implementar chat entre usuários
- [ ] Adicionar sistema de pagamentos
- [ ] Implementar filtros de busca
- [ ] Adicionar testes automatizados

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 