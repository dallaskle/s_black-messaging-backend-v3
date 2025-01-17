import { aiService } from '../clones/services/ai.service';

async function testMessageSearch() {
    try {
        const result = await aiService.messageSearch({
            workspace_id: '6ce0a487-ef99-458d-9393-b12caae9812a',
            base_prompt: 'you are a search engine and are supposed to respond to the query based on the provided context.',
            pinecone_index: 'message-vectors',
            query: 'have we talked about amazon at all?'
        });

        console.log('Message search result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error during message search:', error);
    }
}

testMessageSearch()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    }); 