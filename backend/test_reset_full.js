const axios = require('axios');

async function test() {
  try {
    // 1. Create a fake user to get a token
    const email = `test_${Date.now()}@test.com`;
    console.log("Registering...", email);
    const regRes = await axios.post('http://localhost:3001/api/auth/register', {
      name: 'Test User',
      email: email,
      password: 'password123'
    });
    
    const token = regRes.data.token;
    console.log("Got token", token.substring(0, 20) + "...");

    // 2. Call get pipeline (should create it)
    console.log("Getting pipeline...");
    const pipeRes = await axios.get('http://localhost:3001/api/pipelines', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Pipeline:", pipeRes.data.id);

    // 3. Call reset
    console.log("Resetting pipeline...");
    const resetRes = await axios.post('http://localhost:3001/api/pipelines/reset', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Reset Success!", resetRes.data);
  } catch (err) {
    console.error("Error occurred:", err.response ? err.response.data : err.message);
  }
}

test();
