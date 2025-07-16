const axios = require('axios');

// URLs para testar
const urls = [
  'http://localhost:8000/api',
  'http://10.0.2.2:8000/api',
  'http://127.0.0.1:8000/api'
];

async function testConnection(url) {
  try {
    console.log(`\n🔍 Testando: ${url}`);
    
    const response = await axios.get(`${url}/test`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Conectado! Status: ${response.status}`);
    console.log(`📄 Resposta:`, response.data);
    return true;
  } catch (error) {
    console.log(`❌ Falha na conexão:`);
    console.log(`   - Status: ${error.response?.status || 'N/A'}`);
    console.log(`   - Mensagem: ${error.message}`);
    console.log(`   - Código: ${error.code || 'N/A'}`);
    return false;
  }
}

async function testLogin(url) {
  try {
    console.log(`\n🔐 Testando login em: ${url}`);
    
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const response = await axios.post(`${url}/login`, loginData, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Login testado! Status: ${response.status}`);
    console.log(`📄 Resposta:`, response.data);
    return true;
  } catch (error) {
    console.log(`❌ Falha no login:`);
    console.log(`   - Status: ${error.response?.status || 'N/A'}`);
    console.log(`   - Mensagem: ${error.response?.data?.message || error.message}`);
    console.log(`   - Código: ${error.code || 'N/A'}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de conexão...\n');
  
  let connected = false;
  
  for (const url of urls) {
    const isConnected = await testConnection(url);
    if (isConnected) {
      connected = true;
      console.log(`\n✅ URL funcionando: ${url}`);
      
      // Testar login também
      await testLogin(url);
      break;
    }
  }
  
  if (!connected) {
    console.log('\n❌ Nenhuma URL funcionou!');
    console.log('\n📋 Verifique:');
    console.log('   1. Se o backend Laravel está rodando');
    console.log('   2. Se está na porta 8000');
    console.log('   3. Se o servidor está acessível');
    console.log('   4. Se não há firewall bloqueando');
  }
}

runTests().catch(console.error); 