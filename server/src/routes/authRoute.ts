import express from 'express';
import { register, login, logout , refreshToken } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refesh_token', refreshToken);
router.post('/logout', logout);

export default router;
