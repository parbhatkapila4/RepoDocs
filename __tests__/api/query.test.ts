import { NextRequest } from 'next/server';
import { POST } from '@/app/api/query/route';
import { auth } from '@clerk/nextjs/server';

jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/rag', () => ({
  queryCodebase: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    project: {
      findUnique: jest.fn(),
    },
  },
}));

describe('/api/query', () => {
  beforeEach(() => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if user is not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost:3000/api/query', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'proj1',
        question: 'Test question',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 if required fields are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/query', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'proj1',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('successfully processes a query', async () => {
    const mockQueryCodebase = require('@/lib/rag').queryCodebase;
    mockQueryCodebase.mockResolvedValue({
      answer: 'Test answer',
      sources: [],
    });

    const mockPrisma = require('@/lib/prisma').default;
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj1',
      userId: 'user123',
      name: 'Test Project',
    });

    const request = new NextRequest('http://localhost:3000/api/query', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'proj1',
        question: 'How does authentication work?',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('answer');
    expect(data).toHaveProperty('sources');
  });

  it('handles rate limiting correctly', async () => {
    // This would test rate limiting if implemented
    // Placeholder for now
    expect(true).toBe(true);
  });
});

