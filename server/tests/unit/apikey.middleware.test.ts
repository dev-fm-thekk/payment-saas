import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { authenticateApiKey } from '../../src/middlewares/apikey.middleware';
import type { ApiKeyRequest } from '../../src/middlewares/apikey.middleware';

const mockDb = {
  select: mock(() => mockDb),
  from: mock(() => mockDb),
  where: mock(() => mockDb),
  limit: mock(() => []),
};

mock.module('../../db', () => ({
  default: mockDb,
}));

mock.module('../../utils/hashing', () => ({
  hashToken: mock((token: string) => `hashed_${token}`),
}));

describe('authenticateApiKey Middleware', () => {
  let req: Partial<ApiKeyRequest>;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: mock((code: number) => res),
      json: mock((body: any) => res),
    };
    next = mock(() => {});
    
    mockDb.select.mockClear();
    mockDb.from.mockClear();
    mockDb.where.mockClear();
    mockDb.limit.mockClear();
    res.status.mockClear();
    res.json.mockClear();
    next.mockClear();
  });

  it('returns 401 if x-api-key header is missing', async () => {
    await authenticateApiKey(req as ApiKeyRequest, res as any, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 'failed', error: 'Missing x-api-key header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if x-api-key is an array', async () => {
    req.headers = { 'x-api-key': ['key1', 'key2'] };
    await authenticateApiKey(req as ApiKeyRequest, res as any, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 'failed', error: 'Missing x-api-key header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if API key is invalid (not found in DB)', async () => {
    req.headers = { 'x-api-key': 'invalid_key' };
    mockDb.limit.mockReturnValueOnce([]);
    
    await authenticateApiKey(req as ApiKeyRequest, res as any, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 'failed', error: 'Invalid API key' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets companyId and calls next if API key is valid', async () => {
    req.headers = { 'x-api-key': 'valid_key' };
    mockDb.limit.mockReturnValueOnce([{ companyId: 'company_123' }]);
    
    await authenticateApiKey(req as ApiKeyRequest, res as any, next);
    
    expect(req.companyId).toBe('company_123');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
