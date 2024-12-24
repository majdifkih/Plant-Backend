import request from 'supertest';
import prisma from '../src/utils/db';
import app from '../src/index';

jest.mock('../src/utils/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    plant: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    version: {
      create: jest.fn(),
    },
  },
}));

describe('PostController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all posts', async () => {
    (prisma.post.findMany as jest.Mock).mockResolvedValue([
      {
        id_post: 1,
        titre: 'Test Post',
        description: 'This is a test post',
        date_creation: new Date(),
      },
    ]);

    const response = await request(app).get('/api/posts');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id_post: 1,
        titre: 'Test Post',
        description: 'This is a test post',
        date_creation: expect.any(String), // Vérifie que la date est une chaîne valide
      },
    ]);
  });
});


describe('PostController', () => {
  it('should fetch all posts', async () => {
    prisma.post.findMany = jest.fn().mockResolvedValue([
      { id_post: 1, titre: 'Test Post', description: 'This is a test post' },
    ]);

    const response = await request(app).get('/api/posts');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('should fetch a post by id', async () => {
    prisma.post.findUnique = jest.fn().mockResolvedValue({
      id_post: 1,
      titre: 'Test Post',
      description: 'This is a test post',
    });

    const response = await request(app).get('/api/posts/1');
    expect(response.status).toBe(200);
    expect(response.body.titre).toBe('Test Post');
  });

  it('should return 404 if post not found', async () => {
    prisma.post.findUnique = jest.fn().mockResolvedValue(null);

    const response = await request(app).get('/api/posts/999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Post not found');
  });
});
