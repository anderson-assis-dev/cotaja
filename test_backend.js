const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api';

async function testBackend() {
  try {
    console.log('🧪 Testando conexão com o backend...');
    
    // Teste 1: Verificar se o servidor está rodando
    const healthCheck = await axios.get('http://localhost:8000');
    console.log('✅ Servidor Laravel está rodando');
    
    // Teste 2: Verificar se a API está acessível
    const apiCheck = await axios.get(`${API_BASE_URL}/me`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    console.log('✅ API está acessível');
    
    console.log('🎉 Backend está funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o backend:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Dica: Certifique-se de que o servidor Laravel está rodando:');
      console.log('   cd cotaja-backend && php artisan serve');
    }
    
    if (error.response?.status === 401) {
      console.log('✅ API está acessível (401 é esperado sem autenticação)');
    }
  }
}

testBackend(); 