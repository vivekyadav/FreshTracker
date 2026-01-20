import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function getVerificationTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24); // 24 hour expiry
    return expiry;
}

export async function sendVerificationEmail(
    email: string,
    token: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;

        await resend.emails.send({
            from: 'FreshTracker <noreply@freshtracker.app>',
            to: email,
            subject: 'Verify your email address',
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🥗 FreshTracker</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                Thanks for signing up! Please click the button below to verify your email address and start tracking your groceries.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #667eea; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
                This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to send verification email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email',
        };
    }
}
