const sodium = require('libsodium-wrappers');
const https = require('https');

// GitHub repo info
const OWNER = 'dotandeb';
const REPO = 'flightpath';
const TOKEN = process.env.GITHUB_TOKEN;

// Secrets to set
const SECRETS = {
  AMADEUS_API_KEY: 'brQ8OmTJIFY7RmDCuWwRNQc6cJWw2c2e',
  AMADEUS_API_SECRET: 'ABas2BuGP00d5chH',
  NEXT_PUBLIC_APP_URL: 'https://flightpath.solutions'
};

async function getPublicKey() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/actions/secrets/public-key`,
      method: 'GET',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FlightPath-Setup'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

function encryptSecret(publicKey, secret) {
  const messageBytes = Buffer.from(secret, 'utf8');
  const keyBytes = Buffer.from(publicKey, 'base64');
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
  return Buffer.from(encryptedBytes).toString('base64');
}

async function setSecret(name, encryptedValue, keyId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      encrypted_value: encryptedValue,
      key_id: keyId
    });
    
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/actions/secrets/${name}`,
      method: 'PUT',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FlightPath-Setup',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 204) {
          console.log(`✅ Set secret: ${name}`);
          resolve(true);
        } else {
          console.error(`❌ Failed to set ${name}: ${res.statusCode}`, responseData);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  await sodium.ready;
  
  if (!TOKEN) {
    console.error('Error: GITHUB_TOKEN not set');
    process.exit(1);
  }

  console.log('Fetching repository public key...');
  const { key, key_id } = await getPublicKey();
  console.log(`Got key_id: ${key_id}`);

  console.log('\nSetting secrets...');
  for (const [name, value] of Object.entries(SECRETS)) {
    const encrypted = encryptSecret(key, value);
    await setSecret(name, encrypted, key_id);
  }

  console.log('\n✅ All Amadeus secrets set successfully!');
  console.log('\nNext steps:');
  console.log('1. Go to https://vercel.com/account/tokens and create a token');
  console.log('2. Import your project at https://vercel.com/new');
  console.log('3. Get the Org ID and Project ID from Vercel project settings');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
