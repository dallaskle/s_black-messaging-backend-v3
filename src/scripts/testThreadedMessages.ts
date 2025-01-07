import axios from 'axios';
import { Channel, Message } from '../types/database';

const API_URL = 'http://localhost:5001';
let authToken: string;

const testThreadedMessageFlow = async () => {
  try {
    console.log('=== Starting Threaded Message Test Flow ===\n');

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

    // 2. Get first workspace and channel
    console.log('2. FETCHING WORKSPACE AND CHANNEL');
    console.log('-------------------');
    
    const workspacesResponse = await axios.get(
      `${API_URL}/api/workspaces`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const testWorkspace = workspacesResponse.data[0];
    console.log('✓ Using workspace:', testWorkspace.name);

    const channelsResponse = await axios.get(
      `${API_URL}/api/workspaces/${testWorkspace.id}/channels`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const testChannel: Channel = channelsResponse.data[0];
    console.log('✓ Using channel:', testChannel.name);
    console.log('-------------------\n');

    // 3. Create parent message
    console.log('3. CREATING PARENT MESSAGE');
    console.log('-------------------');
    const parentContent = `Parent message ${Date.now()}`;
    console.log('Creating message with content:', parentContent);
    
    const createParentResponse = await axios.post(
      `${API_URL}/api/channels/${testChannel.id}/messages`,
      { content: parentContent },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const parentMessage: Message = createParentResponse.data;
    console.log('✓ Parent message created successfully:');
    console.log('  ID:', parentMessage.id);
    console.log('  Content:', parentMessage.content);
    console.log('-------------------\n');

    // 4. Create thread replies
    console.log('4. CREATING THREAD REPLIES');
    console.log('-------------------');
    
    const reply1Content = `First reply ${Date.now()}`;
    const reply2Content = `Second reply ${Date.now()}`;

    const createReply1Response = await axios.post(
      `${API_URL}/api/channels/${testChannel.id}/messages`,
      { 
        content: reply1Content,
        parentMessageId: parentMessage.id
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const reply1: Message = createReply1Response.data;
    console.log('✓ First reply created successfully:');
    console.log('  Content:', reply1.content);

    const createReply2Response = await axios.post(
      `${API_URL}/api/channels/${testChannel.id}/messages`,
      { 
        content: reply2Content,
        parentMessageId: parentMessage.id
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const reply2: Message = createReply2Response.data;
    console.log('✓ Second reply created successfully:');
    console.log('  Content:', reply2.content);
    console.log('-------------------\n');

    // 5. Get thread messages
    console.log('5. FETCHING THREAD MESSAGES');
    console.log('-------------------');
    
    const threadResponse = await axios.get(
      `${API_URL}/api/messages/${parentMessage.id}/thread`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const threadMessages: Message[] = threadResponse.data;
    console.log(`✓ Found ${threadMessages.length} thread message(s):`);
    threadMessages.forEach((msg: Message, index: number) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log('  ID:', msg.id);
      console.log('  From:', msg.name);
      console.log('  Content:', msg.content);
      console.log('  Parent Message ID:', msg.parent_message_id);
      console.log('  Created at:', new Date(msg.created_at).toLocaleString());
    });
    console.log('-------------------\n');

    // 6. Update a thread reply
    console.log('6. UPDATING THREAD REPLY');
    console.log('-------------------');
    const updatedContent = `${reply1Content} (edited)`;
    console.log('Updating first reply with content:', updatedContent);
    
    const updateResponse = await axios.patch(
      `${API_URL}/api/messages/${reply1.id}`,
      { content: updatedContent },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const updatedReply: Message = updateResponse.data;
    console.log('✓ Reply updated successfully:');
    console.log('  New content:', updatedReply.content);
    console.log('-------------------\n');

    // 7. Delete a thread reply
    console.log('7. DELETING THREAD REPLY');
    console.log('-------------------');
    console.log('Deleting second reply...');
    
    await axios.delete(
      `${API_URL}/api/messages/${reply2.id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✓ Reply deleted successfully');
    console.log('-------------------\n');

    // 8. Verify thread state
    console.log('8. VERIFYING FINAL THREAD STATE');
    console.log('-------------------');
    
    const finalThreadResponse = await axios.get(
      `${API_URL}/api/messages/${parentMessage.id}/thread`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const finalThreadMessages: Message[] = finalThreadResponse.data;
    console.log(`✓ Found ${finalThreadMessages.length} thread message(s):`);
    finalThreadMessages.forEach((msg: Message, index: number) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log('  From:', msg.name);
      console.log('  Content:', msg.content);
      console.log('  Created at:', new Date(msg.created_at).toLocaleString());
      if (msg.updated_at) {
        console.log('  Updated at:', new Date(msg.updated_at).toLocaleString());
      }
    });
    console.log('-------------------\n');

    console.log('\n=== Threaded Message Test Flow Completed Successfully ===');

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
console.log('\n🚀 Starting threaded message test script...\n');
testThreadedMessageFlow()
  .then(() => console.log('\n✨ Script completed\n'))
  .catch(() => console.log('\n❌ Script failed\n')); 