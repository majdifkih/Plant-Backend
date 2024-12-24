import express from 'express'
import { Register,SignIn } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();


router.post('/signup',Register)
router.post('/signin',SignIn)



export default router;