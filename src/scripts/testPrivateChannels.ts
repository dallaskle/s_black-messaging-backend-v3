import axios from 'axios';
import { Channel } from '../types/database';

const API_URL = 'http://localhost:5001';
let authToken: string;

const testPrivateChannelFlow = async () => {
  try {
    console.log('=== Starting Private Channel Test Flow ===\n');

    // 1. Login with primary user
    console.log('1. PRIMARY USER AUTHENTICATION');
    console.log('-------------------');
    console.log('Attempting login with primary user');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'dallasklein3@gmail.com',
      password: 'TestPass123!'
    });
    
    authToken = loginResponse.data.session.access_token;
    console.log('✓ Primary user login successful!');
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

    // 3. Create a new private channel
    console.log('3. PRIVATE CHANNEL CREATION');
    console.log('-------------------');
    const channelData = {
      name: `private-channel-${Date.now()}`,
      description: 'A private test channel',
      topic: 'Private Testing',
      is_private: true
    };
    console.log('Creating private channel with data:', channelData);

    const createChannelResponse = await axios.post(
      `${API_URL}/api/workspaces/${testWorkspace.id}/channels`,
      channelData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const newChannel: Channel = createChannelResponse.data;
    console.log('✓ Private channel created successfully:');
    console.log('  ID:', newChannel.id);
    console.log('  Name:', newChannel.name);
    console.log('  Is Private:', newChannel.is_private);
    console.log('-------------------\n');

    // 4. Get workspace channels
    console.log('4. FETCHING WORKSPACE CHANNELS');
    console.log('-------------------');
    console.log(`Fetching channels for workspace: ${testWorkspace.name}`);
    
    const workspaceChannelsResponse = await axios.get(
      `${API_URL}/api/workspaces/${testWorkspace.id}/channels`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const channels = workspaceChannelsResponse.data;
    console.log(`✓ Found ${channels.length} channel(s):`);
    channels.forEach((channel: Channel, index: number) => {
      console.log(`\nChannel ${index + 1}:`);
      console.log('  ID:', channel.id);
      console.log('  Name:', channel.name);
      console.log('  Is Private:', channel.is_private);
    });
    console.log('-------------------\n');

    // 5. Update channel settings
    console.log('5. UPDATING PRIVATE CHANNEL');
    console.log('-------------------');
    const updateData = {
      name: `${newChannel.name}-updated`,
      topic: 'Updated private topic'
    };
    
    const updateResponse = await axios.patch(
      `${API_URL}/api/channels/${newChannel.id}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const updatedChannel = updateResponse.data;
    console.log('✓ Private channel updated successfully:');
    console.log('  New Name:', updatedChannel.name);
    console.log('  New Topic:', updatedChannel.topic);
    console.log('-------------------\n');

    console.log('\n=== Private Channel Test Flow Completed Successfully ===');

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
console.log('\n🚀 Starting private channel test script...\n');
testPrivateChannelFlow()
  .then(() => console.log('\n✨ Script completed\n'))
  .catch(() => console.log('\n❌ Script failed\n'));
