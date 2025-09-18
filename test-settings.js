// Test script to debug settings API
const fetch = require('node-fetch');

async function testSettings() {
  try {
    console.log('Testing GET /api/settings...');
    const response = await fetch('http://localhost:3000/api/settings', {
      headers: {
        'Cookie': 'next-auth.session-token=test' // Add your actual session cookie here
      }
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());

    const text = await response.text();
    console.log('Response body:', text);

    if (response.status === 400) {
      try {
        const json = JSON.parse(text);
        console.log('Parsed error:', json);
      } catch (e) {
        console.log('Could not parse as JSON:', e.message);
      }
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testSettings();