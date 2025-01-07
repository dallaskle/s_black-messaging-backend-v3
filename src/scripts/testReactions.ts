import axios from 'axios';
import { Channel, Message, Reaction } from '../types/database';

const API_URL = 'http://localhost:5001';
let authToken: string;

const testReactionFlow = async () => {
  try {
    console.log('=== Starting Reaction Test Flow ===\n');

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

    // 3. Create a test message
    console.log('3. CREATING TEST MESSAGE');
    console.log('-------------------');
    const messageContent = `Test message for reactions ${Date.now()}`;
    console.log('Creating message with content:', messageContent);
    
    const createMessageResponse = await axios.post(
      `${API_URL}/api/channels/${testChannel.id}/messages`,
      { content: messageContent },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const testMessage: Message = createMessageResponse.data;
    console.log('✓ Message created successfully:');
    console.log('  ID:', testMessage.id);
    console.log('  Content:', testMessage.content);
    console.log('-------------------\n');

    // 4. Add reactions to the message
    console.log('4. ADDING REACTIONS');
    console.log('-------------------');
    const emojis = ['👍', '❤️', '🎉'];
    
    for (const emoji of emojis) {
      console.log(`Adding reaction: ${emoji}`);
      const addReactionResponse = await axios.post(
        `${API_URL}/api/channels/${testChannel.id}/messages/${testMessage.id}/reactions`,
        { emoji },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      const reaction: Reaction = addReactionResponse.data;
      console.log('✓ Reaction added successfully:');
      console.log('  ID:', reaction.id);
      console.log('  Emoji:', reaction.emoji);
    }
    console.log('-------------------\n');

    // 5. Get message reactions
    console.log('5. FETCHING MESSAGE REACTIONS');
    console.log('-------------------');
    
    const messageReactionsResponse = await axios.get(
      `${API_URL}/api/channels/${testChannel.id}/messages/${testMessage.id}/reactions`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const messageReactions: Reaction[] = messageReactionsResponse.data;
    console.log(`✓ Found ${messageReactions.length} reaction(s):`);
    messageReactions.forEach((reaction, index) => {
      console.log(`\nReaction ${index + 1}:`);
      console.log('  ID:', reaction.id);
      console.log('  Emoji:', reaction.emoji);
      console.log('  Created at:', new Date(reaction.created_at).toLocaleString());
    });
    console.log('-------------------\n');

    // 6. Get reaction counts
    console.log('6. FETCHING REACTION COUNTS');
    console.log('-------------------');
    
    const reactionCountsResponse = await axios.get(
      `${API_URL}/api/channels/${testChannel.id}/messages/${testMessage.id}/reactions/count`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const reactionCounts = reactionCountsResponse.data;
    console.log('✓ Reaction counts:');
    Object.entries(reactionCounts).forEach(([emoji, count]) => {
      console.log(`  ${emoji}: ${count}`);
    });
    console.log('-------------------\n');

    // 7. Remove a reaction
    console.log('7. REMOVING REACTION');
    console.log('-------------------');
    const emojiToRemove = emojis[0];
    console.log(`Removing reaction: ${emojiToRemove}`);
    
    await axios.delete(
      `${API_URL}/api/channels/${testChannel.id}/messages/${testMessage.id}/reactions`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { emoji: emojiToRemove }
      }
    );
    
    console.log('✓ Reaction removed successfully');
    console.log('-------------------\n');

    // 8. Get popular workspace reactions
    console.log('8. FETCHING POPULAR WORKSPACE REACTIONS');
    console.log('-------------------');
    
    const popularReactionsResponse = await axios.get(
      `${API_URL}/api/workspaces/${testWorkspace.id}/reactions/popular`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const popularReactions = popularReactionsResponse.data;
    console.log('✓ Popular reactions:');
    popularReactions.forEach((item: { emoji: string; count: number }, index: number) => {
      console.log(`  ${index + 1}. ${item.emoji}: ${item.count} uses`);
    });
    console.log('-------------------\n');

    console.log('\n=== Reaction Test Flow Completed Successfully ===');

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
console.log('\n🚀 Starting reaction test script...\n');
testReactionFlow()
  .then(() => console.log('\n✨ Script completed\n'))
  .catch(() => console.log('\n❌ Script failed\n')); 