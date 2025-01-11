import axios from 'axios';
import { WorkspaceMember, ChannelMember } from '../types/database';

const API_URL = 'http://localhost:5001';
let authToken: string;

const testMemberListFlow = async () => {
  try {
    console.log('=== Starting Member List Test Flow ===\n');

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

    // 3. Get workspace members list
    console.log('3. FETCHING WORKSPACE MEMBERS LIST');
    console.log('-------------------');
    
    const workspaceMembersResponse = await axios.get(
      `${API_URL}/api/workspaces/${testWorkspace.id}/members/list`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const workspaceMembers: WorkspaceMember[] = workspaceMembersResponse.data;
    console.log(`✓ Found ${workspaceMembers.length} workspace member(s):`);
    workspaceMembers.forEach((member, index) => {
      console.log(`\nMember ${index + 1}:`);
      console.log('  ID:', member.id);
      console.log('  User ID:', member.user_id);
      console.log('  Role:', member.role);
      console.log('  Display Name:', member.display_name || 'Not set');
      console.log('  User Name:', (member as any).users?.name);
      console.log('  User Email:', (member as any).users?.email);
    });
    console.log('-------------------\n');

    // 4. Get workspace channels
    console.log('4. FETCHING WORKSPACE CHANNELS');
    console.log('-------------------');
    
    const channelsResponse = await axios.get(
      `${API_URL}/api/workspaces/${testWorkspace.id}/channels`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const channels = channelsResponse.data;
    if (channels.length === 0) {
      throw new Error('No channels found. Please create a channel first.');
    }
    
    const testChannel = channels[0];
    console.log('✓ Using channel for testing:');
    console.log('  ID:', testChannel.id);
    console.log('  Name:', testChannel.name);
    console.log('-------------------\n');

    // 5. Get channel members list
    console.log('5. FETCHING CHANNEL MEMBERS LIST');
    console.log('-------------------');
    
    const channelMembersResponse = await axios.get(
      `${API_URL}/api/workspaces/channels/${testChannel.id}/members/list`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const channelMembers: ChannelMember[] = channelMembersResponse.data;
    console.log(`✓ Found ${channelMembers.length} channel member(s):`);
    channelMembers.forEach((member, index) => {
      console.log(`\nMember ${index + 1}:`);
      console.log('  ID:', member.id);
      console.log('  User ID:', member.user_id);
      console.log('  Role:', member.role);
      console.log('  User Name:', (member as any).users?.name);
      console.log('  User Email:', (member as any).users?.email);
    });
    console.log('-------------------\n');

    console.log('\n=== Member List Test Flow Completed Successfully ===');

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
console.log('\n🚀 Starting member list test script...\n');
testMemberListFlow()
  .then(() => console.log('\n✨ Script completed\n'))
  .catch(() => console.log('\n❌ Script failed\n')); 