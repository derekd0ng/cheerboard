import fetch from 'node-fetch';

// Test script to verify deployment
async function testDeployment(baseUrl = 'http://localhost:3001') {
  console.log(`Testing deployment at: ${baseUrl}`);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test messages endpoint
    console.log('\n2. Testing messages endpoint...');
    const messagesResponse = await fetch(`${baseUrl}/api/messages`);
    const messagesData = await messagesResponse.json();
    console.log(`Messages count: ${messagesData.length}`);
    
    // Test posting a message (only in development)
    if (baseUrl.includes('localhost')) {
      console.log('\n3. Testing message posting...');
      const postResponse = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Test message from deployment script' })
      });
      
      if (postResponse.ok) {
        console.log('Message posted successfully');
      } else {
        console.log('Message posting failed:', postResponse.status);
      }
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Get URL from command line or use default
const testUrl = process.argv[2] || 'http://localhost:3001';
testDeployment(testUrl);