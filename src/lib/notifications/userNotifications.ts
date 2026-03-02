import { sendEmail } from '@/lib/mail';

export async function sendPasswordResetEmail(email: string, resetLink: string, name: string) {
    try {
        await sendEmail({
            to: email,
            subject: 'Reset Your Password - Saudi Horizon',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee;">
                    <h2 style="color: #c5a059; border-bottom: 2px solid #c5a059; padding-bottom: 10px;">Password Reset Request</h2>
                    <p>Hello ${name},</p>
                    <p>We received a request to reset the password for your Saudi Horizon account. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background: #c5a059; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p>If you did not request a password reset, please ignore this email. This link will expire in 1 hour.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0 20px;" />
                    <p style="font-size: 11px; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} Saudi Horizon. All rights reserved.</p>
                </div>
            `
        });
        return { success: true };
    } catch (err) {
        console.error('Failed to send password reset email:', err);
        return { success: false, error: err };
    }
}
