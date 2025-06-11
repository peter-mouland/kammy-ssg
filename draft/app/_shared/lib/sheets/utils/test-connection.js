// scripts/test-google-connection.js
import https from 'https';
import dns from 'dns';

const endpoints = [
    'oauth2.googleapis.com',
    'sheets.googleapis.com',
    'www.googleapis.com',
    'accounts.google.com'
];

async function testDNS(domain) {
    return new Promise((resolve) => {
        dns.lookup(domain, (err, address) => {
            if (err) {
                resolve({ domain, status: 'DNS_FAIL', error: err.message });
            } else {
                resolve({ domain, status: 'DNS_OK', address });
            }
        });
    });
}

async function testHTTPS(domain) {
    return new Promise((resolve) => {
        const req = https.request({
            hostname: domain,
            path: '/',
            method: 'HEAD',
            timeout: 5000
        }, (res) => {
            resolve({
                domain,
                status: 'HTTPS_OK',
                statusCode: res.statusCode,
                headers: Object.keys(res.headers).slice(0, 3)
            });
        });

        req.on('error', (err) => {
            resolve({ domain, status: 'HTTPS_FAIL', error: err.message });
        });

        req.on('timeout', () => {
            resolve({ domain, status: 'TIMEOUT', error: 'Request timed out' });
        });

        req.end();
    });
}

async function runNetworkDiagnostics() {
    console.log('🔍 Running Google APIs Network Diagnostics...\n');

    // Test DNS resolution
    console.log('📡 Testing DNS resolution...');
    for (const domain of endpoints) {
        const result = await testDNS(domain);
        const status = result.status === 'DNS_OK' ? '✅' : '❌';
        console.log(`${status} ${result.domain}: ${result.status} ${result.address || result.error}`);
    }

    console.log('\n🌐 Testing HTTPS connectivity...');
    for (const domain of endpoints) {
        const result = await testHTTPS(domain);
        const status = result.status === 'HTTPS_OK' ? '✅' : '❌';
        console.log(`${status} ${result.domain}: ${result.status} ${result.statusCode || result.error}`);
    }

    // Test specific OAuth endpoint
    console.log('\n🔑 Testing OAuth token endpoint...');
    const oauthResult = await testHTTPS('oauth2.googleapis.com');
    if (oauthResult.status === 'HTTPS_FAIL') {
        console.log('❌ OAuth endpoint blocked - this is likely your issue!');
        console.log('\n💡 Recommended actions:');
        console.log('1. Contact IT to whitelist *.googleapis.com');
        console.log('2. Use mobile hotspot for development');
        console.log('3. Request VPN access if available');
        console.log('4. Ask for corporate proxy configuration');
    } else {
        console.log('✅ OAuth endpoint accessible - SSL might be the issue');
        console.log('\n💡 Try these SSL fixes:');
        console.log('1. NODE_TLS_REJECT_UNAUTHORIZED=0 for development');
        console.log('2. Update Node.js to latest LTS version');
        console.log('3. Check system date/time settings');
    }

    // Environment info
    console.log('\n📊 Environment Info:');
    console.log(`Node.js: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`HTTP_PROXY: ${process.env.HTTP_PROXY || 'not set'}`);
    console.log(`HTTPS_PROXY: ${process.env.HTTPS_PROXY || 'not set'}`);
    console.log(`NODE_TLS_REJECT_UNAUTHORIZED: ${process.env.NODE_TLS_REJECT_UNAUTHORIZED || 'not set'}`);
}

runNetworkDiagnostics().catch(console.error);
