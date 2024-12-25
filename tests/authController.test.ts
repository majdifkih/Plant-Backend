import { Register, SignIn } from '../src/controllers/AuthController';
import prisma from '../src/utils/db';
import request from 'supertest'; 
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

describe('AuthController', () => {
  it('should register a new user', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(null); // Simuler un utilisateur non trouvé
    prisma.user.create = jest.fn().mockResolvedValue({
      id: 1,
      nom: 'Test User',
      email: 'test@example.com',
      motDePasse: 'hashedPassword',
      role: 'Client',
    });
    
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        nom: 'Test User',
        email: 'test@example.com',
        password: 'password',
        role: 'Client',
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created successfully');
  });

  it('should sign in an existing user', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      motDePasse: 'hashedPassword',
      role: 'Client',
    });

    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Sign in successful');
  });

  it('should return an error if user not found', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(null); // Simuler utilisateur non trouvé
    
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'nonexistent@example.com',
        password: 'password',
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });
});