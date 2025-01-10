import { Request, Response } from 'express';
import { Channel, ChannelMember } from '../../types/database';

export interface MockSupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

export interface MockSupabaseQuery {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  single: jest.Mock;
}

export const createMockRequest = (body = {}, params = {}, cookies = {}): Partial<Request> => ({
    body,
    params,
    cookies
});

export const createMockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
};

export const createMockChannel = (overrides?: Partial<Channel & { channel_members?: any[] }>): Channel & { channel_members?: any[] } => ({
  id: 'channel-123',
  workspace_id: 'workspace-123',
  name: 'test-channel',
  is_private: false,
  type: 'channel',
  topic: null,
  description: null,
  created_by: 'user-123',
  created_at: new Date().toISOString(),
  channel_members: [],
  ...overrides
});

export const createMockChannelMember = (overrides?: Partial<ChannelMember>): ChannelMember => ({
  id: 'member-123',
  channel_id: 'channel-123',
  user_id: 'user-123',
  role: 'member',
  joined_at: new Date().toISOString(),
  ...overrides
});

export const mockSupabaseQuery = (): MockSupabaseQuery => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
}); 