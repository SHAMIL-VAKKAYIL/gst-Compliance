import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from 'crypto'

export type AuthTokens = {
	accessToken: string;
	refreshToken: string;
};

export class TokenService {
	issueTokens(userId: string): AuthTokens {
		return {
			accessToken: jwt.sign(
				{ userId, tokenType: "access" },
				this.getSecret("JWT_SECRET"),
				{ expiresIn: "15m" },
			),
			refreshToken: jwt.sign(
				{ userId, tokenType: "refresh" },
				this.getSecret("JWT_REFRESH_SECRET", "JWT_SECRET"),
				{ expiresIn: "7d" },
			),
		};
	}

	refreshAccessToken(refreshToken: string): string {
		const payload = jwt.verify(
			refreshToken,
			this.getSecret("JWT_REFRESH_SECRET", "JWT_SECRET"),
		);

		if (!this.isRefreshTokenPayload(payload)) {
			throw new Error("Invalid refresh token");
		}

		return jwt.sign(
			{ userId: payload.userId, tokenType: "access" },
			this.getSecret("JWT_SECRET"),
			{ expiresIn: "15m" },
		);
	}

	private isRefreshTokenPayload(
		payload: string | JwtPayload,
	): payload is JwtPayload & { userId: string; tokenType: "refresh" } {
		return typeof payload !== "string"
			&& typeof payload.userId === "string"
			&& payload.tokenType === "refresh";
	}

	private getSecret(primaryName: string, fallbackName?: string): string {
		const secret = process.env[primaryName]
			?? (fallbackName ? process.env[fallbackName] : undefined);

		if (!secret) {
			throw new Error(`${primaryName} is not configured`);
		}

		return secret;
	}
	generateInvitationToken() {
		const token = crypto.randomBytes(32).toString("hex");
		return token
	}
}
