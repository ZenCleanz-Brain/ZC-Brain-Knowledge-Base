/**
 * ElevenLabs API Connectivity Test Script
 *
 * This script tests the ElevenLabs API endpoints used by the n8n workflow
 * to ensure connectivity and proper authentication.
 *
 * Usage:
 *   1. Set your API key: export ELEVENLABS_API_KEY=sk_xxxxx
 *   2. Run: node test-api.js
 */

const https = require('https');

// Configuration
const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || 'agent_4101kebd8snsff0az1775xyzhamc';
const BASE_URL = 'api.elevenlabs.io';

if (!API_KEY) {
  console.error('❌ Error: ELEVENLABS_API_KEY environment variable not set');
  console.log('\nUsage:');
  console.log('  Windows (PowerShell): $env:ELEVENLABS_API_KEY="sk_xxxxx"; node test-api.js');
  console.log('  Windows (CMD): set ELEVENLABS_API_KEY=sk_xxxxx && node test-api.js');
  console.log('  Mac/Linux: ELEVENLABS_API_KEY=sk_xxxxx node test-api.js');
  process.exit(1);
}

/**
 * Make an HTTPS request to ElevenLabs API
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Test 1: Get Agent Configuration
 */
async function testGetAgentConfig() {
  console.log('\n📋 Test 1: Get Agent Configuration');
  console.log('   Endpoint: GET /v1/convai/agents/' + AGENT_ID);

  try {
    const result = await makeRequest('GET', `/v1/convai/agents/${AGENT_ID}`);

    if (result.status === 200) {
      console.log('   ✅ Success! Agent found.');
      console.log(`   Agent Name: ${result.data.name}`);

      // Count workflow nodes and KB documents
      const nodes = result.data.workflow?.nodes || {};
      const nodeCount = Object.keys(nodes).length;
      let totalDocs = 0;

      console.log(`   Workflow Nodes: ${nodeCount}`);

      for (const [nodeId, nodeConfig] of Object.entries(nodes)) {
        const kb = nodeConfig.additional_knowledge_base || [];
        totalDocs += kb.length;
        if (kb.length > 0) {
          console.log(`     - ${nodeConfig.label || nodeId}: ${kb.length} KB docs`);
        }
      }

      console.log(`   Total KB Documents: ${totalDocs}`);
      return result.data;
    } else {
      console.log(`   ❌ Failed with status ${result.status}`);
      console.log(`   Response: ${JSON.stringify(result.data)}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Test 2: List Knowledge Base Documents
 */
async function testListKbDocs() {
  console.log('\n📚 Test 2: List Knowledge Base Documents');
  console.log('   Endpoint: GET /v1/convai/knowledge-base');

  try {
    const result = await makeRequest('GET', '/v1/convai/knowledge-base');

    if (result.status === 200) {
      const docs = result.data.documents || result.data || [];
      console.log(`   ✅ Success! Found ${Array.isArray(docs) ? docs.length : 'unknown number of'} documents.`);

      // Show first 5 documents
      if (Array.isArray(docs) && docs.length > 0) {
        console.log('   Sample documents:');
        docs.slice(0, 5).forEach(doc => {
          console.log(`     - ${doc.name} (ID: ${doc.id})`);
        });
        if (docs.length > 5) {
          console.log(`     ... and ${docs.length - 5} more`);
        }
      }
      return docs;
    } else {
      console.log(`   ❌ Failed with status ${result.status}`);
      console.log(`   Response: ${JSON.stringify(result.data)}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Test 3: Verify a specific document exists (if agent config was retrieved)
 */
async function testDocumentSearch(agentConfig) {
  console.log('\n🔍 Test 3: Document Search in Agent Config');

  if (!agentConfig) {
    console.log('   ⏭️  Skipped (no agent config available)');
    return;
  }

  // Find first document from any workflow node
  const nodes = agentConfig.workflow?.nodes || {};
  let sampleDoc = null;
  let sampleNodeLabel = null;

  for (const [nodeId, nodeConfig] of Object.entries(nodes)) {
    const kb = nodeConfig.additional_knowledge_base || [];
    if (kb.length > 0) {
      sampleDoc = kb[0];
      sampleNodeLabel = nodeConfig.label || nodeId;
      break;
    }
  }

  if (sampleDoc) {
    console.log(`   Testing search for: "${sampleDoc.name}"`);
    console.log(`   Expected location: ${sampleNodeLabel}`);

    // Simulate the search logic from the n8n workflow
    let found = false;
    for (const [nodeId, nodeConfig] of Object.entries(nodes)) {
      const kb = nodeConfig.additional_knowledge_base || [];
      const match = kb.find(doc => doc.name === sampleDoc.name);
      if (match) {
        console.log(`   ✅ Found in node: ${nodeConfig.label || nodeId}`);
        console.log(`      Document ID: ${match.id}`);
        found = true;
      }
    }

    if (!found) {
      console.log('   ❌ Document not found (unexpected)');
    }
  } else {
    console.log('   ⚠️  No documents found in any workflow node');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ElevenLabs API Connectivity Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Agent ID: ${AGENT_ID}`);
  console.log(`API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);

  // Run tests
  const agentConfig = await testGetAgentConfig();
  await testListKbDocs();
  await testDocumentSearch(agentConfig);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Tests Complete');
  console.log('═══════════════════════════════════════════════════════════');

  if (agentConfig) {
    console.log('\n✅ API connectivity verified. Ready to use the n8n workflow.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your API key and agent ID.');
  }
}

runTests().catch(console.error);
