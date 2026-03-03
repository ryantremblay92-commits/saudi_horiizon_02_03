import { sendEmail } from '@/lib/mail';

export async function sendPasswordResetEmail(email: string, resetLink: string, name: string) {
    try {
        await sendEmail({
            to: email,
            subject: 'Reset Your Password - Saudi Horizon',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background: #0A1628; padding: 30px; text-align: center;">
                        <h1 style="color: #C5A059; margin: 0; font-size: 24px; letter-spacing: 2px;">SAUDI HORIZON</h1>
                    </div>
                    <div style="padding: 40px; background: #fff;">
                        <h2 style="color: #0A1628; margin: 0 0 20px; font-size: 20px; border-bottom: 2px solid #C5A059; padding-bottom: 10px;">Password Reset Request</h2>
                        <p>Hello ${name},</p>
                        <p>We received a request to reset the password for your Saudi Horizon account. Click the button below to set a new password:</p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${resetLink}" style="background: #C5A059; color: #0A1628; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Reset Password</a>
                        </div>
                        <p style="color: #666; font-size: 13px;">If you did not request a password reset, please ignore this email. This link will expire in 1 hour.</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                        <p style="font-size: 11px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Saudi Horizon CO. All rights reserved.</p>
                        <p style="font-size: 10px; color: #aaa; margin: 5px 0 0;">Bldg 8550, Omar Bin Al Khattab St, Dammam, KSA</p>
                    </div>
                </div>
            `
        });
        return { success: true };
    } catch (err) {
        console.error('Failed to send password reset email:', err);
        return { success: false, error: err };
    }
}

export async function sendWelcomeEmail(email: string, name: string) {
    try {
        await sendEmail({
            to: email,
            subject: 'Welcome to Saudi Horizon - Your Partner in Heavy Equipment',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background: #0A1628; padding: 40px; text-align: center;">
                        <h1 style="color: #C5A059; margin: 0; font-size: 28px; letter-spacing: 3px;">SAUDI HORIZON</h1>
                        <p style="color: #8B9DB8; margin: 10px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Heavy Equipment Parts Supplier</p>
                    </div>
                    <div style="padding: 45px; background: #fff; line-height: 1.6;">
                        <h2 style="color: #0A1628; margin: 0 0 20px; font-size: 22px;">Welcome to the Horizon, ${name}!</h2>
                        <p>Thank you for registering with <strong>Saudi Horizon</strong>. We are honored to be your trusted partner for high-quality heavy equipment spare parts.</p>
                        <p>Your account is now active. You can now:</p>
                        <ul style="color: #555; padding-left: 20px;">
                            <li>Browse our extensive catalog of genuine parts.</li>
                            <li>Request instant quotes for bulk orders.</li>
                            <li>Track your orders and view your transaction history.</li>
                            <li>Access exclusive business pricing and updates.</li>
                        </ul>
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" 
                               style="background: #0A1628; color: #C5A059; padding: 16px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; text-transform: uppercase; border: 2px solid #C5A059;">
                                Access Your Dashboard
                            </a>
                        </div>
                        <p style="margin-bottom: 0;">If you have any questions, simply reply to this email or visit our website.</p>
                        <p style="margin-top: 5px;">Best Regards,<br><strong>The Saudi Horizon Team</strong></p>
                    </div>
                    <div style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #eee;">
                        <p style="font-size: 11px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Saudi Horizon CO. All rights reserved.</p>
                        <p style="font-size: 10px; color: #aaa; margin: 5px 0 0;">Bldg 8550, Omar Bin Al Khattab St, Dammam, KSA</p>
                    </div>
                </div>
            `
        });
        return { success: true };
    } catch (err) {
        console.error('Failed to send welcome email:', err);
        return { success: false, error: err };
    }
}

export async function sendOrderConfirmationEmail(email: string, name: string, orderDetails: any) {
    try {
        const itemsList = orderDetails.items.map((item: any) => `
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${item.product?.name || item.name || 'Product'} x ${item.quantity}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #0A1628; font-weight: bold; text-align: right; font-size: 14px;">SAR ${item.total?.toLocaleString() || (item.price * item.quantity).toLocaleString()}</td>
            </tr>
        `).join('');

        await sendEmail({
            to: email,
            subject: `Order Confirmation #${orderDetails._id.toString().slice(-8).toUpperCase()} - Saudi Horizon`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background: #0A1628; padding: 35px; text-align: center;">
                        <h1 style="color: #C5A059; margin: 0; font-size: 24px; letter-spacing: 2px;">SAUDI HORIZON</h1>
                    </div>
                    <div style="padding: 40px; background: #fff;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="background: #EBF7EE; color: #1E7E34; padding: 10px 20px; border-radius: 50px; display: inline-block; font-size: 13px; font-weight: bold;">
                                ORDER RECEIVED SUCCESSFULLY
                            </div>
                        </div>
                        <h2 style="color: #0A1628; margin: 0 0 10px; font-size: 20px;">Hello ${name},</h2>
                        <p style="color: #666; margin: 0 0 25px; font-size: 14px; line-height: 1.5;">Your order has been placed and is currently being processed by our fulfillment center. Below is your order summary:</p>
                        
                        <div style="background: #F8F9FA; border-radius: 10px; padding: 25px; border-left: 5px solid #C5A059;">
                            <p style="margin: 0 0 15px; font-size: 12px; color: #999; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Order Summary</p>
                            <table style="width: 100%; border-collapse: collapse;">
                                ${itemsList}
                                <tr>
                                    <td style="padding: 20px 0 0; color: #0A1628; font-weight: bold; font-size: 16px;">Total Amount</td>
                                    <td style="padding: 20px 0 0; color: #C5A059; font-weight: bold; font-size: 18px; text-align: right;">SAR ${orderDetails.totalAmount?.toLocaleString()}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="margin-top: 30px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <p style="margin: 0 0 5px; font-size: 12px; color: #999; font-weight: bold;">SHIPPING DETAILS</p>
                            <p style="margin: 0; font-size: 14px; color: #444; line-height: 1.4;">
                                ${orderDetails.shippingAddress?.address || 'Standard Pickup/Delivery'}<br/>
                                ${orderDetails.shippingAddress?.phone || ''}
                            </p>
                        </div>

                        <div style="text-align: center; margin: 40px 0 20px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/orders" 
                               style="background: #C5A059; color: #0A1628; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; text-transform: uppercase;">
                                View Order Details
                            </a>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #eee;">
                        <p style="font-size: 11px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Saudi Horizon CO. All rights reserved.</p>
                        <p style="font-size: 10px; color: #aaa; margin: 5px 0 0;">Bldg 8550, Omar Bin Al Khattab St, Dammam, KSA</p>
                    </div>
                </div>
            `
        });
        return { success: true };
    } catch (err) {
        console.error('Failed to send order confirmation email:', err);
        return { success: false, error: err };
    }
}
