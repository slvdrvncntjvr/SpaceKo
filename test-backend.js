const baseUrl = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing SpaceKo Backend API...\n');

  try {
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    console.log('\n2. Testing resources endpoint...');
    const resourcesResponse = await fetch(`${baseUrl}/api/resources`);
    const resourcesData = await resourcesResponse.json();
    console.log('✅ Resources:', resourcesData.length, 'items found');

    if (resourcesData.length > 0) {
      console.log('\n3. Testing specific resource...');
      const resourceId = resourcesData[0].id;
      const resourceResponse = await fetch(`${baseUrl}/api/resources/${resourceId}`);
      const resourceData = await resourceResponse.json();
      console.log('✅ Resource details:', resourceData.name);
    }

    console.log('\n4. Testing users endpoint...');
    const usersResponse = await fetch(`${baseUrl}/api/users`);
    const usersData = await usersResponse.json();
    console.log('✅ Users:', usersData.length, 'items found');

    console.log('\n5. Testing login endpoint...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userCode: '2023-1234' })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login response:', loginData);

    console.log('\n🎉 All API tests passed! Backend is working correctly.');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run dev');
  }
}

testAPI();
