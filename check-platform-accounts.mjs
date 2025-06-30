// Check if dhairyashil@getmemeetings.com is available in the platform
import fetch from 'node-fetch';

async function checkPlatformAccounts() {
  try {
    console.log('Checking platform accounts...');
    
    // Try to get accounts through the API with proper authentication
    const response = await fetch('http://localhost:5000/api/accounts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'access_granted=true'
      }
    });

    if (!response.ok) {
      console.log(`API response: ${response.status}`);
      return false;
    }

    const accounts = await response.json();
    console.log('Available accounts:', accounts.map(acc => acc.email));
    
    const dhairyaAccount = accounts.find(acc => acc.email === 'dhairyashil@getmemeetings.com');
    if (dhairyaAccount) {
      console.log('✓ Found dhairyashil@getmemeetings.com account');
      return true;
    } else {
      console.log('✗ dhairyashil@getmemeetings.com not found in platform');
      return false;
    }
    
  } catch (error) {
    console.log('Error checking platform accounts:', error.message);
    return false;
  }
}

const accountExists = await checkPlatformAccounts();
console.log('Account available:', accountExists);