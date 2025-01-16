import supabase from '../config/supabaseClient';
import { Clone, Message, Mention, MessageStatus } from '../types/database';
import { MentionService } from '../mentions/mentionService';
import { MentionProcessorService } from '../mentions/mentionProcessorService';
import { createMessage } from '../services/messageServices';
import * as fs from 'fs';
import * as path from 'path';

const TEST_USER_ID = process.env.TEST_USER_ID || '';
const TEST_WORKSPACE_ID = process.env.TEST_WORKSPACE_ID || '';
const TEST_CHANNEL_ID = process.env.TEST_CHANNEL_ID || '';
const TEST_CLONE_ID = '716e9379-f45a-4878-b9ce-68734aedff9c';

interface TestData {
    messageIds: string[];
    mentionIds: string[];
}

async function getTestClone(): Promise<Clone> {
    const { data: clone, error } = await supabase
        .from('clones')
        .select('*')
        .eq('id', TEST_CLONE_ID)
        .single();

    if (error || !clone) {
        throw new Error(`Clone not found with ID: ${TEST_CLONE_ID}`);
    }
    return clone;
}

async function saveTestData(testData: TestData) {
    const dataPath = path.join(__dirname, 'mentionProcessingTestData.json');
    fs.writeFileSync(dataPath, JSON.stringify(testData, null, 2));
    console.log('Test data saved to:', dataPath);
}

async function waitForMentionResponse(mentionId: string, timeoutMs: number = 10000): Promise<Mention> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
        const mention = await MentionService.getMentionById(mentionId);
        
        if (!mention) {
            throw new Error('Mention not found');
        }

        if (mention.responded || mention.error) {
            return mention;
        }

        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Timeout waiting for mention response');
}

async function testMentionProcessing() {
    try {
        const testData: TestData = {
            messageIds: [],
            mentionIds: []
        };

        console.log('Getting test clone...');
        const clone = await getTestClone();
        console.log('Using clone:', clone.name, clone.id);

        // Get workspace ID for the channel
        const { data: channel } = await supabase
            .from('channels')
            .select('workspace_id')
            .eq('id', TEST_CHANNEL_ID)
            .single();

        if (!channel) {
            throw new Error('Channel not found');
        }

        // Test 1: Simple question
        console.log('\nTest 1: Simple question');
        const message1 = await createMessage(
            TEST_CHANNEL_ID,
            TEST_USER_ID,
            `@${clone.name} What is 2+2?`
        );
        testData.messageIds.push(message1.id);
        console.log('Created message:', message1.content);

        // Get the mention that was created
        const { data: mentions1 } = await supabase
            .from('mentions')
            .select('*')
            .eq('message_id', message1.id);
        
        if (!mentions1 || mentions1.length === 0) {
            throw new Error('No mention created for first message');
        }
        testData.mentionIds.push(mentions1[0].id);

        console.log('Waiting for response...');
        const processedMention1 = await waitForMentionResponse(mentions1[0].id);
        console.log('Mention processed:', {
            responded: processedMention1.responded,
            error: processedMention1.error,
            responseMessageId: processedMention1.response_message_id
        });

        if (processedMention1.response_message_id) {
            const { data: responseMessage } = await supabase
                .from('clone_messages')
                .select('content')
                .eq('id', processedMention1.response_message_id)
                .single();
            console.log('Clone response:', responseMessage?.content);
        }

        // Test 2: Thread conversation
        console.log('\nTest 2: Thread conversation');
        const message2 = await createMessage(
            TEST_CHANNEL_ID,
            TEST_USER_ID,
            `@${clone.name} Can you explain how you calculated that?`,
            undefined,
            [message1.id] // Set as reply to first message
        );
        testData.messageIds.push(message2.id);
        console.log('Created reply message:', message2.content);

        const { data: mentions2 } = await supabase
            .from('mentions')
            .select('*')
            .eq('message_id', message2.id);
        
        if (!mentions2 || mentions2.length === 0) {
            throw new Error('No mention created for second message');
        }
        testData.mentionIds.push(mentions2[0].id);

        console.log('Waiting for response...');
        const processedMention2 = await waitForMentionResponse(mentions2[0].id);
        console.log('Mention processed:', {
            responded: processedMention2.responded,
            error: processedMention2.error,
            responseMessageId: processedMention2.response_message_id
        });

        if (processedMention2.response_message_id) {
            const { data: responseMessage } = await supabase
                .from('clone_messages')
                .select('content')
                .eq('id', processedMention2.response_message_id)
                .single();
            console.log('Clone response:', responseMessage?.content);
        }

        // Save test data for cleanup
        await saveTestData(testData);

        console.log('\nAll tests completed successfully!');
        console.log('Created test data:');
        console.log('- Messages:', testData.messageIds);
        console.log('- Mentions:', testData.mentionIds);
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

    testMentionProcessing()
        .then(() => {
            console.log('Tests completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Tests failed:', error);
            process.exit(1);
        });
} 