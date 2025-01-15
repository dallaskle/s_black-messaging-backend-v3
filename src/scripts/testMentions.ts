import supabase from '../config/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { Clone, Message, Mention, MessageStatus } from '../types/database';
import { MentionParserService } from '../services/mentionParserService';
import { MentionService } from '../services/mentionService';
import * as messageService from '../services/messageServices';
import * as fs from 'fs';
import * as path from 'path';

const TEST_USER_ID = process.env.TEST_USER_ID || '';
const TEST_WORKSPACE_ID = process.env.TEST_WORKSPACE_ID || '';
const TEST_CHANNEL_ID = process.env.TEST_CHANNEL_ID || '';

// Store test data for cleanup
interface TestData {
    messageIds: string[];
    cloneIds: string[];
}

async function createTestClone(name: string, isGlobal: boolean = false): Promise<Clone> {
    const { data: clone, error } = await supabase
        .from('clones')
        .insert({
            name,
            description: `Test clone ${name}`,
            base_prompt: 'Test prompt',
            visibility: isGlobal ? 'global' : 'private',
            workspace_id: isGlobal ? null : TEST_WORKSPACE_ID,
            created_by_user_id: TEST_USER_ID
        })
        .select()
        .single();

    if (error) throw error;
    return clone;
}

async function saveTestData(testData: TestData) {
    const dataPath = path.join(__dirname, 'mentionsTestData.json');
    fs.writeFileSync(dataPath, JSON.stringify(testData, null, 2));
    console.log('Test data saved to:', dataPath);
}

// Helper function to convert enriched message to regular message format
function convertToMessage(enrichedMessage: any): Message {
    return {
        id: enrichedMessage.id,
        channel_id: enrichedMessage.channel_id,
        user_id: enrichedMessage.user_id,
        content: enrichedMessage.content,
        parent_message_id: enrichedMessage.parent_message_id,
        created_at: enrichedMessage.created_at,
        updated_at: enrichedMessage.updated_at,
        status: enrichedMessage.status || MessageStatus.Active,
        channels: enrichedMessage.channels,
        users: enrichedMessage.users,
        files: enrichedMessage.files
    };
}

async function testMentions() {
    try {
        const testData: TestData = {
            messageIds: [],
            cloneIds: []
        };

        console.log('Creating test clones...');
        const globalClone = await createTestClone('GlobalTestClone', true);
        const workspaceClone = await createTestClone('WorkspaceTestClone');

        testData.cloneIds.push(globalClone.id, workspaceClone.id);

        console.log('Testing message creation with mentions...');
        // Test creating a message with both global and workspace clone mentions
        const messageContent = `Hello @${globalClone.name} and @${workspaceClone.name}!`;
        const createdMessage = await messageService.createMessage(
            TEST_CHANNEL_ID,
            TEST_USER_ID,
            messageContent
        );

        console.log('Created message:', createdMessage);
        testData.messageIds.push(createdMessage.id);

        // Verify mentions were created
        const { data: mentions } = await supabase
            .from('mentions')
            .select('*')
            .eq('message_id', createdMessage.id);

        console.log('Mentions created:', mentions);
        if (!mentions || mentions.length !== 2) {
            throw new Error('Expected 2 mentions to be created');
        }

        // Test updating message with different mentions
        console.log('Testing message update...');
        const updatedContent = `Updated: Hello @${globalClone.name}!`;
        const messageToUpdate = convertToMessage(createdMessage);
        messageToUpdate.content = updatedContent;

        const updatedMessage = await messageService.updateMessage(
            createdMessage.id,
            TEST_USER_ID,
            messageToUpdate
        );

        console.log('Updated message:', updatedMessage);

        // Verify mentions were updated
        const { data: updatedMentions } = await supabase
            .from('mentions')
            .select('*')
            .eq('message_id', createdMessage.id);

        console.log('Updated mentions:', updatedMentions);
        if (!updatedMentions || updatedMentions.length !== 1) {
            throw new Error('Expected 1 mention after update');
        }

        // Create another test message
        const secondMessageContent = `Testing another mention @${globalClone.name}!`;
        const secondMessage = await messageService.createMessage(
            TEST_CHANNEL_ID,
            TEST_USER_ID,
            secondMessageContent
        );

        console.log('Created second message:', secondMessage);
        testData.messageIds.push(secondMessage.id);

        // Save test data for cleanup
        await saveTestData(testData);

        console.log('All tests completed successfully!');
        console.log('Created test data:');
        console.log('- Messages:', testData.messageIds);
        console.log('- Clones:', testData.cloneIds);
        console.log('\nRun cleanup script to remove test data when finished.');

    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    }
}

// Run the tests
if (require.main === module) {
    if (!TEST_USER_ID || !TEST_WORKSPACE_ID || !TEST_CHANNEL_ID) {
        console.error('Required environment variables are not set');
        process.exit(1);
    }

    testMentions()
        .then(() => {
            console.log('Tests completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Tests failed:', error);
            process.exit(1);
        });
} 