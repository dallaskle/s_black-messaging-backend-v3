import { getSignedUrl } from '../../../messages_v2/utils/fileUrlSigner';
import { serviceClient } from '../../../config/supabaseClient';
import { File } from '../../../types/database';
import { StorageClient } from '@supabase/storage-js';

// Mock service client
const mockCreateSignedUrl = jest.fn(() => Promise.resolve({ data: null, error: null }));
const mockFrom = jest.fn(() => ({
  createSignedUrl: mockCreateSignedUrl
}));

jest.mock('../../../config/supabaseClient', () => ({
  serviceClient: {
    storage: {
      from: mockFrom
    } as unknown as StorageClient
  }
}));

describe('fileUrlSigner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate signed URL successfully', async () => {
    // Arrange
    const mockFile: File = {
      id: 'file-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      file_url: 'http://example.com/public/files/test.jpg',
      file_name: 'test.jpg',
      file_size: 1024,
      mime_type: 'image/jpeg',
      uploaded_at: new Date().toISOString(),
    };

    const mockSignedUrl = 'http://example.com/signed/files/test.jpg';
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedURL: mockSignedUrl },
      error: null,
    });

    // Act
    const result = await getSignedUrl(mockFile);

    // Assert
    expect(result).toBe(mockSignedUrl);
    expect(mockFrom).toHaveBeenCalledWith('s-black-messaging-files');
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('files/test.jpg', 3600);
  });

  it('should handle invalid file URL format', async () => {
    // Arrange
    const mockFile: File = {
      id: 'file-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      file_url: 'invalid-url',
      file_name: 'test.jpg',
      file_size: 1024,
      mime_type: 'image/jpeg',
      uploaded_at: new Date().toISOString(),
    };

    // Act
    const result = await getSignedUrl(mockFile);

    // Assert
    expect(result).toBe('invalid-url');
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockCreateSignedUrl).not.toHaveBeenCalled();
  });

  it('should handle signing error', async () => {
    // Arrange
    const mockFile: File = {
      id: 'file-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      file_url: 'http://example.com/public/files/test.jpg',
      file_name: 'test.jpg',
      file_size: 1024,
      mime_type: 'image/jpeg',
      uploaded_at: new Date().toISOString(),
    };

    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'Signing failed' },
    });

    // Act
    const result = await getSignedUrl(mockFile);

    // Assert
    expect(result).toBe(mockFile.file_url);
    expect(mockFrom).toHaveBeenCalledWith('s-black-messaging-files');
  });

  it('should handle unexpected errors', async () => {
    // Arrange
    const mockFile: File = {
      id: 'file-123',
      channel_id: 'channel-123',
      user_id: 'user-123',
      file_url: 'http://example.com/public/files/test.jpg',
      file_name: 'test.jpg',
      file_size: 1024,
      mime_type: 'image/jpeg',
      uploaded_at: new Date().toISOString(),
    };

    mockCreateSignedUrl.mockRejectedValue(new Error('Unexpected error'));

    // Act
    const result = await getSignedUrl(mockFile);

    // Assert
    expect(result).toBe(mockFile.file_url);
    expect(mockFrom).toHaveBeenCalledWith('s-black-messaging-files');
  });
}); 