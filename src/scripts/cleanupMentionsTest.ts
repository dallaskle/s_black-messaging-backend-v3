import supabase from '../config/supabaseClient';
import * as fs from 'fs';
import * as path from 'path';

interface TestData {
    messageIds: string[];
    cloneIds: string[];
}

async function cleanup() {
    console.log('Starting cleanup...');
    
    // Read test data
    const dataPath = path.join(__dirname, 'mentionsTestData.json');
    if (!fs.existsSync(dataPath)) {
        console.log('No test data file found. Nothing to clean up.');
        return;
    }

    const testData: TestData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('Found test data:', testData);

    try {
        // Delete mentions for test messages
        for (const messageId of testData.messageIds) {
            console.log(`Cleaning up mentions for message: ${messageId}`);
            await supabase
                .from('mentions')
                .delete()
                .eq('message_id', messageId);
        }

        // Delete test messages
        console.log('Cleaning up test messages...');
        await supabase
            .from('messages')
            .delete()
            .in('id', testData.messageIds);

        // Delete test clones
        console.log('Cleaning up test clones...');
        await supabase
            .from('clones')
            .delete()
            .in('id', testData.cloneIds);

        // Delete the test data file
        fs.unlinkSync(dataPath);
        console.log('Deleted test data file');

        console.log('Cleanup completed successfully!');
    } catch (error) {
        console.error('Error during cleanup:', error);
        throw error;
    }
}

// Run cleanup
if (require.main === module) {
    cleanup()
        .then(() => {
            console.log('Cleanup script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Cleanup script failed:', error);
            process.exit(1);
        });
} 