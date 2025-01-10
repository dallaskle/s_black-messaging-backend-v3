import { resendConfirmation } from '../../../auth/controllers/resendConfirmationController';
import * as authService from '../../../auth/services/confirmationService';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import AppError from '../../../types/AppError';

jest.mock('../../../auth/services/confirmationService');

// Tests the resend confirmation controller's:
// 1. Successful resending of confirmation email
// 2. Handling of missing email in request
// 3. Error handling for email service failures
describe('resendConfirmationController', () => {
    const validEmail = 'test@example.com';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully resend confirmation email', async () => {
        const mockRequest = createMockRequest({ email: validEmail });
        const mockResponse = createMockResponse();

        await resendConfirmation(mockRequest as any, mockResponse as any);

        expect(authService.resendConfirmationEmail).toHaveBeenCalledWith(validEmail);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({ 
            message: 'Confirmation email has been resent' 
        });
    });

    it('should handle missing email', async () => {
        const mockRequest = createMockRequest({});
        const mockResponse = createMockResponse();

        await resendConfirmation(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ 
            message: 'Email is required' 
        });
    });

    it('should handle service errors', async () => {
        const mockRequest = createMockRequest({ email: validEmail });
        const mockResponse = createMockResponse();

        const error = new AppError('Failed to send email', 500);
        (authService.resendConfirmationEmail as jest.Mock).mockRejectedValue(error);

        await resendConfirmation(mockRequest as any, mockResponse as any);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ 
            message: 'Failed to send email' 
        });
    });
}); 