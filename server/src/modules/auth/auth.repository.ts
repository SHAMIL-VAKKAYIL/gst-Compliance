import { prisma } from "../../prisma/client";
import { AppError } from "../../shared/errors/app-error";

export class AuthRepository {

    async createGoogleUser(email: string, googleId: string) {
        return prisma.user.create({
            data: { email, googleId, providers: ['GOOGLE'], emailVerified: true } // Google already verified it
        });
    }

    async linkGoogleToUser(userId: string, googleId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                googleId,
                providers: { push: 'GOOGLE' } // Prisma array push, adds GOOGLE without duplicating if run twice — actually confirm this, see note below
            }
        });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email }
        });
    }


    async createUser(email: string, passwordHash: string) {

        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new AppError("User with this email already exists", 409);
        }
        return prisma.user.create({
            data: { email, password: passwordHash, providers: ['EMAIL'], emailVerified: false }
        });
    }


    async storeToken(userId: string, token: string) {
        try {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            return await prisma.verificationToken.create({
                data: {
                    userId,
                    token,
                    expiresAt,
                },
            });
        } catch (error) {
            throw new AppError("Token already exists", 409);
        }
    }
    async findVerificationToken(token: string) {
        try {
            return await prisma.verificationToken.findUnique({ where: { token } })

        } catch (error) {
            throw new AppError("Token did not exists", 409);

        }
    }

    async markEmailVerified(userId: string) {
        try {
            return await prisma.user.update({
                where: { id: userId },
                data: { emailVerified: true }
            })
        } catch (error) {
            throw new AppError("user not found", 409);

        }
    }
}