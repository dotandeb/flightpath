const sodium = require('libsodium-wrappers');
const https = require('https');

const OWNER = 'dotandeb';
const REPO = 'flightpath';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_ORG_ID = process.env.VERCEL_ORG_ID;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

async function getPublicKey() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/actions/secrets/public-key`,
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
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
        'Authorization': `token ${GITHUB_TOKEN}`,
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
  
  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN not set');
    process.exit(1);
  }
  
  if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN not set');
    console.log('\nTo get your Vercel token:');
    console.log('1. Go to https://vercel.com/account/tokens');
    console.log('2. Click "Create Token"');
    console.log('3. Name it "github-actions"');
    console.log('4. Copy the token');
    process.exit(1);
  }
  
  if (!VERCEL_ORG_ID || !VERCEL_PROJECT_ID) {
    console.error('❌ VERCEL_ORG_ID and/or VERCEL_PROJECT_ID not set');
    console.log('\nTo get these:');
    console.log('1. Import your project at https://vercel.com/new');
    console.log('2. Select your flightpath GitHub repo');
    console.log('3. After import, go to Project Settings → General');
    console.log('4. Copy the Project ID and Team ID (or Personal Account ID)');
    process.exit(1);
  }

  console.log('Fetching repository public key...\n');
  const { key, key_id } = await getPublicKey();

  const secrets = {
    VERCEL_TOKEN,
    VERCEL_ORG_ID,
    VERCEL_PROJECT_ID
  };

  console.log('Setting Vercel secrets...\n');
  for (const [name, value] of Object.entries(secrets)) {
    const encrypted = encryptSecret(key, value);
    await setSecret(name, encrypted, key_id);
  }

  console.log('\n=== ✅ All Vercel secrets set! ===\n');
  console.log('Your next push to GitHub will auto-deploy to Vercel!\n');
  console.log('To add the domain flightpath.solutions:');
  console.log('1. Go to your Vercel project dashboard');
  console.log('2. Click "Settings" → "Domains"');
  console.log('3. Add "flightpath.solutions"');
  console.log('4. Update your DNS records as shown\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
