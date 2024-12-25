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
    $connect: jest.fn(), // Ajout de la méthode $connect
  },
}));

beforeAll(() => {
  (prisma.$connect as jest.Mock).mockResolvedValue(undefined); // Simule une connexion réussie
});

describe('AuthController', () => {
  it('should register a new user', async () => {
    // Simuler un utilisateur non trouvé dans la base de données
    prisma.user.findUnique = jest.fn().mockResolvedValue(null); 

    // Simuler la création d'un utilisateur avec succès
    prisma.user.create = jest.fn().mockResolvedValue({
      id: 1,
      nom: 'Test User',
      email: 'test@example.com',
      motDePasse: 'hashedPassword',  // Assurez-vous que le mot de passe est "haché"
      role: 'Client',
    });
    
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        nom: 'Test User',
        email: 'test@example.com',
        password: 'password',  // Le mot de passe envoyé doit correspondre à celui dans la simulation
        role: 'Client',
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created successfully');
  });

  // it('should sign in an existing user', async () => {
  //   // Simuler un utilisateur existant dans la base de données
  //   prisma.user.findUnique = jest.fn().mockResolvedValue({
  //     id: 1,
  //     email: 'test@example.com',
  //     motDePasse: 'hashedPassword',  // Le mot de passe haché stocké dans la base
  //     role: 'Client',
  //   });

  //   // Simuler la logique de comparaison du mot de passe
  //   const mockComparePassword = jest.fn().mockResolvedValue(true); // Simuler que la comparaison du mot de passe réussit
    
  //   // S'assurer que la comparaison du mot de passe est utilisée
  //   jest.spyOn(require('../src/utils/authUtils'), 'comparePassword').mockImplementation(mockComparePassword);

  //   const response = await request(app)
  //     .post('/api/auth/signin')
  //     .send({
  //       email: 'test@example.com',
  //       password: 'password', // Le mot de passe envoyé ici doit être correct
  //     });

  //   expect(response.status).toBe(200);
  //   expect(response.body.message).toBe('Sign in successful');
  // });

  it('should return an error if user not found', async () => {
    // Simuler qu'aucun utilisateur n'est trouvé
    prisma.user.findUnique = jest.fn().mockResolvedValue(null); 
    
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
