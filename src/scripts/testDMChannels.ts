import axios from 'axios';
import { Channel } from '../types/database';

const API_URL = 'http://localhost:5001';
let authToken: string;

const testDMChannelFlow = async () => {
  try {
    console.log('=== Starting DM Channel Test Flow ===\n');

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

    // 2. Get user's workspaces
    console.log('2. FETCHING WORKSPACES');
    console.log('-------------------');
    
    const workspacesResponse = await axios.get(
      `${API_URL}/api/workspaces`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const workspaces = workspacesResponse.data;
    if (workspaces.length === 0) {
      throw new Error('No workspaces found. Please create a workspace first.');
    }
    
    const testWorkspace = workspaces[0];
    console.log('✓ Using workspace for testing:');
    console.log('  ID:', testWorkspace.id);
    console.log('  Name:', testWorkspace.name);
    console.log('-------------------\n');

    // 3. Create a DM channel
    console.log('3. DM CHANNEL CREATION');
    console.log('-------------------');
    const targetUserId = 'd412e6a0-4fb6-4cf1-a4da-66666b46cecb'; // Replace with an actual user ID from your database
    console.log(`Creating DM channel with user: ${targetUserId}`);

    const createDMResponse = await axios.post(
      `${API_URL}/api/workspaces/${testWorkspace.id}/dm`,
      {
        targetUserId
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const newDMChannel: Channel = createDMResponse.data;
    console.log('✓ DM channel created successfully:');
    console.log('  ID:', newDMChannel.id);
    console.log('  Name:', newDMChannel.name);
    console.log('  Type:', newDMChannel.type);
    console.log('  Is Private:', newDMChannel.is_private);
    console.log('-------------------\n');

    // 4. Try to create the same DM channel again (should return existing)
    console.log('4. TESTING DUPLICATE DM CREATION');
    console.log('-------------------');
    console.log('Attempting to create the same DM channel again...');

    const duplicateDMResponse = await axios.post(
      `${API_URL}/api/workspaces/${testWorkspace.id}/dm`,
      {
        targetUserId
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const existingDMChannel: Channel = duplicateDMResponse.data;
    console.log('✓ Received existing DM channel:');
    console.log('  ID:', existingDMChannel.id);
    console.log('  Matches original:', existingDMChannel.id === newDMChannel.id);
    console.log('-------------------\n');

    // 5. Get channel details
    console.log('5. FETCHING DM CHANNEL DETAILS');
    console.log('-------------------');
    
    const channelResponse = await axios.get(
      `${API_URL}/api/channels/${newDMChannel.id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const channel = channelResponse.data;
    console.log('✓ DM channel details retrieved:');
    console.log('  ID:', channel.id);
    console.log('  Name:', channel.name);
    console.log('  Type:', channel.type);
    console.log('  Is Private:', channel.is_private);
    console.log('-------------------\n');

    console.log('\n=== DM Channel Test Flow Completed Successfully ===');

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
console.log('\n🚀 Starting DM channel test script...\n');
testDMChannelFlow()
  .then(() => console.log('\n✨ Script completed\n'))
  .catch(() => console.log('\n❌ Script failed\n')); 