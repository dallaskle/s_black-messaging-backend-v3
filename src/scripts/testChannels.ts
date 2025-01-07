import axios from 'axios';
import { Channel } from '../types/database';

const API_URL = 'http://localhost:5001';
let authToken: string;

const testChannelFlow = async () => {
  try {
    console.log('=== Starting Channel Test Flow ===\n');

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

    // 3. Create a new channel
    console.log('3. CHANNEL CREATION');
    console.log('-------------------');
    const channelData = {
      name: `test-channel-${Date.now()}`,
      description: 'A test channel',
      topic: 'Testing',
      is_private: false
    };
    console.log('Creating channel with data:', channelData);

    const createChannelResponse = await axios.post(
      `${API_URL}/api/workspaces/${testWorkspace.id}/channels`,
      channelData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const newChannel: Channel = createChannelResponse.data;
    console.log('✓ Channel created successfully:');
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

    // 5. Get specific channel
    console.log('5. FETCHING SPECIFIC CHANNEL');
    console.log('-------------------');
    console.log(`Fetching channel with ID: ${newChannel.id}`);
    
    const channelResponse = await axios.get(
      `${API_URL}/api/channels/${newChannel.id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const channel = channelResponse.data;
    console.log('✓ Channel details retrieved:');
    console.log('  ID:', channel.id);
    console.log('  Name:', channel.name);
    console.log('  Topic:', channel.topic);
    console.log('  Description:', channel.description);
    console.log('-------------------\n');

    // 6. Update channel
    console.log('6. UPDATING CHANNEL');
    console.log('-------------------');
    const updateData = {
      name: `${channel.name}-updated`,
      topic: 'Updated topic'
    };
    console.log('Updating channel with data:', updateData);
    
    const updateResponse = await axios.patch(
      `${API_URL}/api/channels/${channel.id}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const updatedChannel = updateResponse.data;
    console.log('✓ Channel updated successfully:');
    console.log('  ID:', updatedChannel.id);
    console.log('  New Name:', updatedChannel.name);
    console.log('  New Topic:', updatedChannel.topic);
    console.log('-------------------\n');

    console.log('\n=== Test Flow Completed Successfully ===');

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
console.log('\n🚀 Starting channel test script...\n');
testChannelFlow()
  .then(() => console.log('\n✨ Script completed\n'))
  .catch(() => console.log('\n❌ Script failed\n')); 