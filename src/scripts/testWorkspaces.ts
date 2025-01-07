import axios from 'axios';

const API_URL = 'http://localhost:5001';
let authToken: string;

const testWorkspaceFlow = async () => {
  try {
    console.log('=== Starting Workspace Test Flow ===\n');

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

    // 2. Create a new workspace
    console.log('2. WORKSPACE CREATION');
    console.log('-------------------');
    const workspaceData = {
      name: 'Test Workspace',
      workspace_url: `test-workspace-${Date.now()}`
    };
    console.log('Creating workspace with data:', workspaceData);

    const workspaceResponse = await axios.post(
      `${API_URL}/api/workspaces`,
      workspaceData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✓ Workspace created successfully:');
    console.log('  ID:', workspaceResponse.data.id);
    console.log('  Name:', workspaceResponse.data.name);
    console.log('  URL:', workspaceResponse.data.workspace_url);
    console.log('-------------------\n');

    // 3. Get all workspaces
    console.log('3. FETCHING WORKSPACES');
    console.log('-------------------');
    console.log('Requesting all workspaces...');
    
    const workspacesResponse = await axios.get(
      `${API_URL}/api/workspaces`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const workspaces = workspacesResponse.data;
    console.log(`✓ Found ${workspaces.length} workspace(s)`);
    workspaces.forEach((ws: any, index: number) => {
      console.log(`\nWorkspace ${index + 1}:`);
      console.log('  ID:', ws.id);
      console.log('  Name:', ws.name);
      console.log('  URL:', ws.workspace_url);
    });
    console.log('-------------------\n');

    // 4. Get users for each workspace
    console.log('4. FETCHING WORKSPACE MEMBERS');
    console.log('-------------------');
    
    for (const workspace of workspaces) {
      console.log(`\nFetching members for workspace: ${workspace.name}`);
      console.log('Workspace ID:', workspace.id);
      
      const usersResponse = await axios.get(
        `${API_URL}/api/workspaces/${workspace.id}/members`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      const members = usersResponse.data;
      console.log(`✓ Found ${members.length} member(s):`);
      
      members.forEach((member: any, index: number) => {
        console.log(`\nMember ${index + 1}:`);
        console.log('  User ID:', member.user_id);
        console.log('  Role:', member.role);
        console.log('  Display Name:', member.display_name || 'Not set');
        console.log('  Joined:', new Date(member.joined_at).toLocaleString());
      });
      console.log('-------------------');
    }

    console.log('\n=== Test Flow Completed Successfully ===');

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
console.log('\n🚀 Starting workspace test script...\n');
testWorkspaceFlow()
  .then(() => console.log('\n✨ Script completed\n'))
  .catch(() => console.log('\n❌ Script failed\n')); 