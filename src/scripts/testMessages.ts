import axios from 'axios';
import { EnrichedMessage, Channel } from '../types/database';

const API_URL = 'http://localhost:5001';
let authToken: string;

const testMessageFlow = async () => {
  try {
    console.log('=== Starting Message Test Flow ===\n');

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

    // 3. Get workspace channels
    console.log('3. FETCHING WORKSPACE CHANNELS');
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
    
    const testChannel: Channel = channels[0];
    console.log('✓ Using channel for testing:');
    console.log('  ID:', testChannel.id);
    console.log('  Name:', testChannel.name);
    console.log('-------------------\n');

    // 4. Create first message
    console.log('4. CREATING FIRST MESSAGE');
    console.log('-------------------');
    const messageContent = `Test message ${Date.now()}`;
    console.log('Creating message with content:', messageContent);
    
    const createMessageResponse = await axios.post(
      `${API_URL}/api/channels/${testChannel.id}/messages`,
      { content: messageContent },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const newMessage: EnrichedMessage = createMessageResponse.data;
    console.log('✓ Message created successfully:');
    console.log('  ID:', newMessage.id);
    console.log('  Content:', newMessage.content);
    console.log('  Created at:', new Date(newMessage.created_at).toLocaleString());
    console.log('-------------------\n');

    // 5. Update the message
    console.log('5. UPDATING MESSAGE');
    console.log('-------------------');
    const updatedContent = `${messageContent} (edited)`;
    console.log('Updating message with content:', updatedContent);
    
    const updateMessageResponse = await axios.patch(
      `${API_URL}/api/messages/${newMessage.id}`,
      { content: updatedContent },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const updatedMessage: EnrichedMessage = updateMessageResponse.data;
    console.log('✓ Message updated successfully:');
    console.log('  ID:', updatedMessage.id);
    console.log('  New content:', updatedMessage.content);
    console.log('  Updated at:', new Date(updatedMessage.updated_at!).toLocaleString());
    console.log('-------------------\n');

    // 6. Create second message
    console.log('6. CREATING SECOND MESSAGE');
    console.log('-------------------');
    const secondMessageContent = `Another test message ${Date.now()}`;
    console.log('Creating message with content:', secondMessageContent);
    
    const createSecondMessageResponse = await axios.post(
      `${API_URL}/api/channels/${testChannel.id}/messages`,
      { content: secondMessageContent },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const secondMessage: EnrichedMessage = createSecondMessageResponse.data;
    console.log('✓ Second message created successfully:');
    console.log('  ID:', secondMessage.id);
    console.log('  Content:', secondMessage.content);
    console.log('-------------------\n');

    // 7. Get all channel messages
    console.log('7. FETCHING CHANNEL MESSAGES');
    console.log('-------------------');
    
    const messagesResponse = await axios.get(
      `${API_URL}/api/channels/${testChannel.id}/messages`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const messages: EnrichedMessage[] = messagesResponse.data;
    console.log(`✓ Found ${messages.length} message(s):`);
    messages.forEach((msg: EnrichedMessage, index: number) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log('  ID:', msg.id);
      console.log('  From:', msg.name);
      console.log('  Content:', msg.content);
      console.log('  Created at:', new Date(msg.created_at).toLocaleString());
      if (msg.updated_at) {
        console.log('  Updated at:', new Date(msg.updated_at).toLocaleString());
      }
      if (Object.keys(msg.reactions).length > 0) {
        console.log('  Reactions:', msg.reactions);
      }
    });
    console.log('-------------------\n');

    // 8. Delete the second message
    console.log('8. DELETING SECOND MESSAGE');
    console.log('-------------------');
    console.log('Deleting message with ID:', secondMessage.id);
    
    await axios.delete(
      `${API_URL}/api/messages/${secondMessage.id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✓ Message deleted successfully');
    console.log('-------------------\n');

    // 9. Verify deletion by getting messages again
    console.log('9. VERIFYING DELETION');
    console.log('-------------------');
    
    const finalMessagesResponse = await axios.get(
      `${API_URL}/api/channels/${testChannel.id}/messages`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const finalMessages: EnrichedMessage[] = finalMessagesResponse.data;
    console.log(`✓ Found ${finalMessages.length} message(s) after deletion:`);
    finalMessages.forEach((msg: EnrichedMessage, index: number) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log('  ID:', msg.id);
      console.log('  From:', msg.name);
      console.log('  Content:', msg.content);
    });
    console.log('-------------------\n');

    console.log('\n=== Message Test Flow Completed Successfully ===');

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
console.log('\n🚀 Starting message test script...\n');
testMessageFlow()
  .then(() => console.log('\n✨ Script completed\n'))
  .catch(() => console.log('\n❌ Script failed\n')); 