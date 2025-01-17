import { uploadWorkspaceMessages } from '../message_vector_uploads/message_vector_uploadsService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testMessageVectorUploads() {
  const workspaceId = '6ce0a487-ef99-458d-9393-b12caae9812a';
  const pineconeIndex = process.env.PINECONE_MESSAGE_INDEX;

  if (!pineconeIndex) {
    console.error('PINECONE_MESSAGE_INDEX environment variable not set');
    process.exit(1);
  }

  try {
    // Test with today's date
    console.log('Testing message vector uploads for workspace:', workspaceId);
    console.log('Using Pinecone index:', pineconeIndex);
    
    const today = new Date();
    await uploadWorkspaceMessages(workspaceId, pineconeIndex, today);
    console.log('Successfully processed messages for today');

    // Test with a specific date (e.g., yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    console.log('\nTesting with yesterday\'s date:', yesterday.toISOString().split('T')[0]);
    await uploadWorkspaceMessages(workspaceId, pineconeIndex, yesterday);
    console.log('Successfully processed messages for yesterday');

  } catch (error) {
    console.error('Error during test:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the test
testMessageVectorUploads()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 