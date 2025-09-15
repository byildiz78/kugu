// Basit push notification test scripti

async function testPushNotification() {
  const apiUrl = 'http://localhost:3000';
  const bearerToken = 'air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c';

  try {
    // Önce customer listesini al
    console.log('🔍 Getting customers...');
    const customersResponse = await fetch(`${apiUrl}/api/customers`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });

    if (!customersResponse.ok) {
      throw new Error(`Failed to get customers: ${customersResponse.status}`);
    }

    const customersData = await customersResponse.json();
    const customers = customersData.customers || [];
    
    if (customers.length === 0) {
      console.log('❌ No customers found');
      return;
    }

    const firstCustomer = customers[0];
    console.log(`✅ Found customer: ${firstCustomer.firstName} ${firstCustomer.lastName} (${firstCustomer.id})`);

    // Test notification gönder
    console.log('📤 Sending test notification...');
    const testResponse = await fetch(`${apiUrl}/api/mobile/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`
      },
      body: JSON.stringify({
        customerId: firstCustomer.id,
        type: 'GENERAL'
      })
    });

    console.log(`📨 Test response status: ${testResponse.status}`);
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('❌ Test failed:', errorText);
      return;
    }

    const result = await testResponse.json();
    console.log('✅ Test notification result:', result);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPushNotification();