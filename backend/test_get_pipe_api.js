const axios = require('axios');
async function test() {
  const email = `test_${Date.now()}@test.com`;
  const regRes = await axios.post('http://localhost:3001/api/auth/register', { name: 'Test', email: email, password: 'pass' });
  const token = regRes.data.token;
  const pipeRes = await axios.get('http://localhost:3001/api/pipelines', { headers: { Authorization: `Bearer ${token}` } });
  console.log("Response:", JSON.stringify(pipeRes.data, null, 2));
}
test().catch(e => console.error(e.message));
