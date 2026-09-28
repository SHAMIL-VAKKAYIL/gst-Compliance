import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";

import { AuthRepository } from "./auth.repository";
import { TokenService } from "../../shared/utils/token.service";
import { AppError } from "../../shared/errors/app-error";
import { EmailService } from "./email.service";
import { logger } from "../../shared/utils/logger";

export class OauthService {
    private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

    constructor(
        private authRepository: AuthRepository,
        private tokenService: TokenService,
    ) { }

    async googleAuth(idToken: string) {
        let payload;
        try {
            const ticket = await this.googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
            payload = ticket.getPayload();
        } catch (error) {
            logger.error({ err: error }, 'Error verifying Google ID token:');
            throw new AppError('Invalid Google token');
        }

        if (!payload || !payload.email) {
            throw new AppError('Invalid Google token');
        }

        if (payload.email_verified !== true) {
            throw new AppError('Google account email is not verified');
        }

        const existing = await this.authRepository.findByEmail(payload.email);

        if (!existing) {
            const user = await this.authRepository.createGoogleUser(payload.email, payload.sub);
            const tokens = this.tokenService.issueTokens(user.id);
            return { ...tokens, userId: user.id, isNewAccount: true, email: user.email, isVerified: user.emailVerified };
        }

        if (existing.providers.includes('GOOGLE') && existing.googleId === payload.sub) {
            const tokens = this.tokenService.issueTokens(existing.id);
            return { ...tokens, userId: existing.id, isNewAccount: false, email: existing.email, isVerified: existing.emailVerified };
        }

        if (!existing.emailVerified) {
            throw new AppError('An account with this email already exists but is not verified. Please verify your email before linking Google.');
        }

        const mergedUser = await this.authRepository.linkGoogleToUser(existing.id, payload.sub);
        const tokens = this.tokenService.issueTokens(mergedUser.id);
        return { ...tokens, userId: mergedUser.id, isNewAccount: false, email: mergedUser.email, isVerified: mergedUser.emailVerified };
    }

    refreshAccessToken(refreshToken: string) {
        return this.tokenService.refreshAccessToken(refreshToken);
    }
}


export class AuthService {
    constructor(
        private authRepository: AuthRepository,
        private tokenService: TokenService,
        private emailService: EmailService
    ) { }

    async register(email: string, password: string) {
        // Implement registration logic here
        // For example, hash the password and save the user to the database
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.authRepository.createUser(email, hashedPassword);
        return { userId: user.id };
    }

    async login(email: string, password: string) {
        try {

            const user = await this.authRepository.findByEmail(email);

            if (!user?.password) {
                throw new AppError('User not found');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new AppError('Invalid password');
            }

            const tokens = this.tokenService.issueTokens(user.id);
            return { ...tokens, userId: user.id, email: user.email, isVerified: user.emailVerified };
        } catch (error) {
            logger.error({ err: error }, 'faild to login ')

            throw new AppError('faild to login ');
        }
    }
    async storeToken(email: string, userId: string) {
        try {
            const token = this.tokenService.generateInvitationToken();

            await this.authRepository.storeToken(userId, token)
            await this.emailService.sendVerificationEmail(email, token)

        } catch (error) {
            logger.error({ err: error }, 'invalid token')

            throw new AppError('Invalid token');

        }
    }

    async verifyEmail(token: string) {
        try {

            const record = await this.authRepository.findVerificationToken(token);
            if (!record || record.expiresAt < new Date()) {
                throw new AppError('Invalid or expired token');
            }

            await this.authRepository.markEmailVerified(record.userId);
            return { message: 'Email verified', verified: true };
        } catch (error) {
            logger.error({ err: error }, 'invalid token')
            throw new AppError('Invalid token');
        }
    }
}

