import { Request, Response } from 'express';

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