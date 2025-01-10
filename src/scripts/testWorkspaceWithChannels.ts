import axios from 'axios';
import { WorkspaceWithChannels } from '../types/database';

const API_URL = 'http://localhost:5001';
let authToken: string;

const testWorkspaceWithChannelsFlow = async () => {
  try {
    console.log('=== Starting Workspace With Channels Test Flow ===\n');

    // 1. Login
    console.log('1. AUTHENTICATION');
    console.log('-------------------');
    console.log('Attempting login with email: dallasklein3@gmail.com');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'dallasklein3@gmail.com',
      password: 'TestPass123!'
    });
    
    authToken = loginResponse.data.session.access_token;
    console.log('✓ Login successful!');
    console.log(`✓ Token received: ${authToken.substring(0, 20)}...`);
    console.log('-------------------\n');

    // 2. Get workspace with channels
    console.log('2. FETCHING WORKSPACE WITH CHANNELS');
    console.log('-------------------');
    
    const workspaceResponse = await axios.get(
      `${API_URL}/api/workspaces/channels`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('Workspace Response:', workspaceResponse.data);
    
    const workspace: WorkspaceWithChannels = workspaceResponse.data;
    console.log('✓ Workspace details:');
    console.log('  ID:', workspace.id);
    console.log('  Name:', workspace.name);
    console.log('  URL:', workspace.workspace_url);
    console.log('\n✓ Channels:');
    workspace.channels.forEach((channel, index) => {
      console.log(`\nChannel ${index + 1}:`);
      console.log('  ID:', channel.id);
      console.log('  Name:', channel.name);
      console.log('  Type:', channel.type);
      console.log('  Is Private:', channel.is_private);
      console.log('  Topic:', channel.topic || 'No topic set');
      console.log('  Description:', channel.description || 'No description set');
      console.log('  Created by:', channel.created_by);
      console.log('  Created at:', new Date(channel.created_at).toLocaleString());
    });
    console.log('-------------------\n');

    console.log('\n=== Workspace With Channels Test Flow Completed Successfully ===');

  } catch (error) {
    console.error('\n=== Error in Test Flow ===');
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:');
      console.error('  Status:', error.response?.status);
      console.error('  Message:', error.response?.data?.message || error.message);
      console.error('  URL:', error.config?.url);
      console.error('  Method:', error.config?.method?.toUpperCase());
    } else {
      console.error('Unexpected Error:', error);
    }
    console.error('=== End of Error Report ===');
  }
};

// Run the test
console.log('\n🚀 Starting workspace with channels test script...\n');
testWorkspaceWithChannelsFlow()
  .then(() => console.log('\n✨ Script completed\n'))
  .catch(() => console.log('\n❌ Script failed\n')); 