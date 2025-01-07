import axios from 'axios';

const API_URL = 'http://localhost:5001';
let authToken: string;

const addUserToWorkspace = async () => {
  try {
    console.log('=== Adding User To Workspace ===\n');

    // 1. Login as admin
    console.log('1. AUTHENTICATION');
    console.log('-------------------');
    console.log('Attempting login with admin email: dallasklein3@gmail.com');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'dallasklein3@gmail.com',
      password: 'TestPass123!'
    });
    
    authToken = loginResponse.data.session.access_token;
    console.log('✓ Login successful!');
    console.log('-------------------\n');

    // 2. Add user to workspace
    console.log('2. ADDING USER TO WORKSPACE');
    console.log('-------------------');
    
    const workspaceId = '11a00c7a-5b10-4f4a-9937-5415f60add6d';
    const userId = 'd412e6a0-4fb6-4cf1-a4da-66666b46cecb';
    
    const addMemberResponse = await axios.post(
      `${API_URL}/api/workspaces/${workspaceId}/members`,
      {
        userId,
        role: 'member'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✓ User added successfully to workspace');
    console.log('  Workspace ID:', workspaceId);
    console.log('  User ID:', userId);
    console.log('-------------------\n');

    console.log('\n=== User Added Successfully ===');

  } catch (error) {
    console.error('\n=== Error ===');
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:');
      console.error('  Status:', error.response?.status);
      console.error('  Message:', error.response?.data?.message || error.message);
    } else {
      console.error('Unexpected Error:', error);
    }
  }
};

// Run the script
console.log('\n🚀 Starting add user to workspace script...\n');
addUserToWorkspace()
  .then(() => console.log('\n✨ Script completed\n'))
  .catch(() => console.log('\n❌ Script failed\n')); 