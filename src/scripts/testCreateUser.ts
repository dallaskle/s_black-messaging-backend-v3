import axios from 'axios';
import { User } from '../types/database';

const API_URL = 'http://localhost:5001';

const type = "single" //or "all"

const testSingleUser = async () => {
    // 1. Create first test user
    console.log('1. CREATING FIRST TEST USER');
    console.log('-------------------');
    const userData1 = {
    name: 'Dallas 2',
    email: `dallasjklein@gmail.com`,
    password: 'TestPass123!'
    };
    console.log('Creating user with data:', { ...userData1, password: '****' });

    const createResponse1 = await axios.post(
    `${API_URL}/auth/register`,
    userData1
    );
}

const testCreateUserFlow = async () => {
  try {
    console.log('=== Starting User Creation Test Flow ===\n');

    // 1. Create first test user
    console.log('1. CREATING FIRST TEST USER');
    console.log('-------------------');
    const userData1 = {
      name: 'Test User 1',
      email: `testuser1_${Date.now()}@example.com`,
      password: 'TestPass123!'
    };
    console.log('Creating user with data:', { ...userData1, password: '****' });

    const createResponse1 = await axios.post(
      `${API_URL}/auth/register`,
      userData1
    );
    
    const newUser1: User = createResponse1.data;
    console.log('✓ First user created successfully:');
    console.log('  ID:', newUser1.id);
    console.log('  Name:', newUser1.name);
    console.log('  Email:', newUser1.email);
    console.log('-------------------\n');

    // 2. Try to create user with same email (should fail)
    console.log('2. TESTING DUPLICATE EMAIL');
    console.log('-------------------');
    console.log('Attempting to create user with same email...');
    
    try {
      await axios.post(
        `${API_URL}/auth/register`,
        {
          ...userData1,
          name: 'Different Name'
        }
      );
      console.error('✗ Error: Should not allow duplicate email');
    } catch (error: any) {
      console.log('✓ Successfully prevented duplicate email:');
      console.log('  Status:', error.response?.status);
      console.log('  Message:', error.response?.data?.message);
    }
    console.log('-------------------\n');

    // 3. Test invalid data scenarios
    console.log('3. TESTING VALIDATION');
    console.log('-------------------');

    // Test invalid email
    console.log('\nTesting invalid email:');
    try {
      await axios.post(
        `${API_URL}/auth/register`,
        {
          name: 'Test User',
          email: 'invalid-email',
          password: 'TestPass123!'
        }
      );
      console.error('✗ Error: Should not accept invalid email');
    } catch (error: any) {
      console.log('✓ Successfully rejected invalid email:');
      console.log('  Message:', error.response?.data?.message);
    }

    // Test invalid password
    console.log('\nTesting weak password:');
    try {
      await axios.post(
        `${API_URL}/auth/register`,
        {
          name: 'Test User',
          email: 'valid@example.com',
          password: 'weak'
        }
      );
      console.error('✗ Error: Should not accept weak password');
    } catch (error: any) {
      console.log('✓ Successfully rejected weak password:');
      console.log('  Message:', error.response?.data?.message);
    }

    // Test invalid name
    console.log('\nTesting invalid name:');
    try {
      await axios.post(
        `${API_URL}/auth/register`,
        {
          name: 'A',  // too short
          email: 'valid@example.com',
          password: 'TestPass123!'
        }
      );
      console.error('✗ Error: Should not accept invalid name');
    } catch (error: any) {
      console.log('✓ Successfully rejected invalid name:');
      console.log('  Message:', error.response?.data?.message);
    }
    console.log('-------------------\n');

    // 4. Create second valid user
    console.log('4. CREATING SECOND TEST USER');
    console.log('-------------------');
    const userData2 = {
      name: 'Test User 2',
      email: `testuser2_${Date.now()}@example.com`,
      password: 'TestPass123!'
    };
    console.log('Creating user with data:', { ...userData2, password: '****' });

    const createResponse2 = await axios.post(
      `${API_URL}/auth/register`,
      userData2
    );
    
    const newUser2: User = createResponse2.data;
    console.log('✓ Second user created successfully:');
    console.log('  ID:', newUser2.id);
    console.log('  Name:', newUser2.name);
    console.log('  Email:', newUser2.email);
    console.log('-------------------\n');

    // 5. Test login with new user
    console.log('5. TESTING LOGIN WITH NEW USER');
    console.log('-------------------');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: userData2.email,
      password: userData2.password
    });
    
    console.log('✓ Login successful:');
    console.log('  User ID:', loginResponse.data.user.id);
    console.log('  Session:', loginResponse.data.session ? 'Created' : 'Failed');
    console.log('-------------------\n');

    console.log('\n=== User Creation Test Flow Completed Successfully ===');

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
console.log('\n🚀 Starting user creation test script...\n');

if (type === "single") {
  testSingleUser()
    .then(() => console.log('\n✨ Script completed\n'))
    .catch(() => console.log('\n❌ Script failed\n')); 
} else if (type === "all") {
  testCreateUserFlow()
    .then(() => console.log('\n✨ Script completed\n'))
    .catch(() => console.log('\n❌ Script failed\n')); 
}