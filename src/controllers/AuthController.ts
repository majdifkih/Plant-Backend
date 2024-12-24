import { Request, Response, RequestHandler } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from "../utils/db";
import { PrismaClientValidationError } from "@prisma/client/runtime/library";

export const Register: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { nom, email, password, role } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nom,
        email,
        motDePasse: hashedPassword,
        role: role || 'Client',
      },
    });

    // Generate token after creating the user
    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    res.status(201).json({ message: 'User created successfully', token, user: newUser });
  } catch (error: any) { 
    console.error('Error creating user:', error);
    if (error instanceof PrismaClientValidationError) {
      res.status(400).json({ error: 'Validation error', details: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
};

export const SignIn: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.motDePasse);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Incorrect password' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '5h' });

    res.status(200).json({ message: 'Sign in successful', token });
  } catch (error: any) {
    console.error('Error signing in:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
