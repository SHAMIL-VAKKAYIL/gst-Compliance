import express from 'express';
import { AuthController } from './auth.controller';
import { AuthService, OauthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { TokenService } from '../../shared/utils/token.service';
import { EmailService } from './email.service'
import { requireAuth } from '../../shared/middleware/auth';
const router = express.Router();

// POST /api/auth/v1/google

const authRepo = new AuthRepository();
const tokenService = new TokenService();
const emailSvc = new EmailService();
const oauthSvc = new OauthService(authRepo, tokenService);
const authService = new AuthService(authRepo, tokenService,emailSvc);
const authCtrl = new AuthController(oauthSvc, authService);

router.post('/google', authCtrl.googleLogin.bind(authCtrl));
router.post('/register', authCtrl.register.bind(authCtrl));
router.post('/login', authCtrl.login.bind(authCtrl));
router.post('/refresh', authCtrl.refresh.bind(authCtrl));
router.post('/send-email', requireAuth, authCtrl.sendEmail.bind(authCtrl));
router.post('/verify-email', authCtrl.emailVerification.bind(authCtrl));

export default router;