import express from 'express';
import { AuthController } from './auth.controller';
import { AuthService, OauthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { TokenService } from '../../shared/utils/token.service';

const router = express.Router();

// POST /api/auth/v1/google

const authRepo = new AuthRepository();
const tokenService = new TokenService();
const oauthSvc = new OauthService(authRepo, tokenService);
const authService = new AuthService(authRepo, tokenService);
const authCtrl = new AuthController(oauthSvc, authService);

router.post('/google', authCtrl.googleLogin.bind(authCtrl));
router.post('/register', authCtrl.register.bind(authCtrl));
router.post('/login', authCtrl.login.bind(authCtrl));
router.post('/refresh', authCtrl.refresh.bind(authCtrl));

export default router;