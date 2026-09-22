import { log } from "node:console";
import { AuthService, OauthService } from "./auth.service";
import { Request, Response, NextFunction } from "express";

function getRefreshTokenFromCookie(req: Request): string | null {
    const cookieHeader = req.headers.cookie ?? "";

    for (const cookie of cookieHeader.split(";")) {
        const [name, ...valueParts] = cookie.trim().split("=");
        if (name === "refreshToken") {
            return decodeURIComponent(valueParts.join("="));
        }
    }

    return null;
}

export class AuthController {
    constructor(private oauthService: OauthService, private authService: AuthService) { }

    private setRefreshTokenCookie(res: Response, refreshToken: string): void {
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { idToken } = req.body;
            const result = await this.oauthService.googleAuth(idToken);
            console.log(result);
            this.setRefreshTokenCookie(res, result.refreshToken);
            res.status(200).json({accessToken:result.accessToken, userId: result.userId, isNewAccount: result.isNewAccount,email:result.email});
        } catch (error) {
            next(error);
        }
    }

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await this.authService.register(email, password);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            this.setRefreshTokenCookie(res, result.refreshToken);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    refresh(req: Request, res: Response, next: NextFunction): void {
        try {
            const refreshToken = req.cookies?.refreshToken ?? getRefreshTokenFromCookie(req);
            if (!refreshToken) {
                res.status(401).json({ message: "Refresh token missing" });
                return;
            }

            const accessToken = this.oauthService.refreshAccessToken(refreshToken);
            res.status(200).json({ accessToken });
        } catch (error) {
            next(error);
        }
    }
}