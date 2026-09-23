import { Resend } from "resend";

export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationEmail(
    email: string,
    token: string
  ): Promise<void> {
    const verificationUrl =
      `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;

    try {
      await this.resend.emails.send({
        from: "GST Compliance <onboarding@resend.dev>",
        to: "msvshamil470@gmail.com",
        subject: "Verify your email",
        html: `
          <h2>Verify your email</h2>

          <p>Click the button below to verify your email address:</p>

          <p>
            <a href="${verificationUrl}"
               style="
                 display:inline-block;
                 padding:12px 20px;
                 background:#2563eb;
                 color:white;
                 text-decoration:none;
                 border-radius:6px;
               ">
              Verify Email
            </a>
          </p>

          <p>This link expires in 24 hours.</p>
        `,
      });
      console.log('sended');
      
    } catch (error) {
      console.error(
        `[EmailService] Failed to send verification email to ${email}:`,
        error
      );

      throw error;
    }
  }
}