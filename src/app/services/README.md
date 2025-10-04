# FalaRobo Login Service

## LoginService

O `LoginService` é responsável pela autenticação dos usuários no sistema FalaRobo.

### Funcionalidades

- **Autenticação Mock**: Utiliza dados simulados para login
- **Persistência**: Armazena dados do usuário no localStorage quando "Remember me" é marcado
- **Gerenciamento de Estado**: Controla o estado de autenticação do usuário
- **Token JWT Mock**: Gera tokens simulados para testes

### Credenciais de Teste

```
Email: teste@teste.com
Senha: 123
Username: Teste
```

### Métodos Principais

- `login(credentials)`: Autentica o usuário
- `logout()`: Remove dados de autenticação
- `isLoggedIn()`: Verifica se usuário está logado
- `getCurrentUser()`: Retorna dados do usuário atual
- `getAuthToken()`: Retorna token de autenticação

### Uso no Componente

```typescript
constructor(private loginService: LoginService) {}

// Fazer login
this.loginService.login(credentials).subscribe(response => {
  if (response.success) {
    // Login realizado com sucesso
    console.log('User:', response.user);
  }
});

// Verificar se está logado
if (this.loginService.isLoggedIn()) {
  // Usuário autenticado
}
```

### LocalStorage

Quando "Remember me" está marcado, os seguintes dados são salvos:
- `falarobo_user`: Dados do usuário (JSON)
- `falarobo_token`: Token de autenticação

### Próximos Passos

Para integração com API real, substitua os métodos mock pelas chamadas HTTP adequadas usando HttpClient do Angular.
