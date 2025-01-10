import { resendConfirmationEmail } from '../../../auth/services/confirmationService';
import supabase from '../../../config/supabaseClient';

jest.mock('../../../config/supabaseClient');

// Tests the confirmation service's:
// 1. Handling of already registered users
// 2. Successful email resend operation
// 3. Error handling for various Supabase response scenarios
describe('confirmationService', () => {
    const testEmail = 'test@example.com';

    beforeEach(() => {
        jest.clearAllMocks();
        // Spy on console methods
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should handle already registered user case', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValue({
            error: {
                status: 400,
                message: 'User already registered'
            }
        });

        await resendConfirmationEmail(testEmail);

        expect(console.log).toHaveBeenCalledWith('Confirmation email resent. Please check your inbox.');
    });

    it('should handle successful resend', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValue({
            data: {},
            error: null
        });

        await resendConfirmationEmail(testEmail);

        expect(console.log).toHaveBeenCalledWith('Confirmation email resent successfully.');
    });

    it('should handle other errors', async () => {
        const errorMessage = 'Some other error';
        (supabase.auth.signUp as jest.Mock).mockResolvedValue({
            error: {
                status: 500,
                message: errorMessage
            }
        });

        await resendConfirmationEmail(testEmail);

        expect(console.error).toHaveBeenCalledWith('Error resending confirmation email:', errorMessage);
    });
}); 