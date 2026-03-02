import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/db/models/Notification';
import mongoose from 'mongoose';

// Settings schema (same as in settings route)
const SettingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

/**
 * Check if a specific notification type is enabled in admin settings
 */
async function isNotificationEnabled(settingKey: string): Promise<boolean> {
    try {
        const notifSettings = await Settings.findOne({ key: 'notifications' });
        if (!notifSettings || !notifSettings.value) {
            // Default: enabled for orders, low stock, quotes; disabled for new users & marketing
            const defaults: Record<string, boolean> = {
                orderNotifications: true,
                lowStockAlerts: true,
                newUserRegistrations: true,
                quoteRequests: true,
                marketingEmails: false,
            };
            return defaults[settingKey] ?? true;
        }
        // If the key exists in settings, use it; otherwise default to true
        return notifSettings.value[settingKey] ?? true;
    } catch (err) {
        console.error('Error checking notification settings:', err);
        return true; // Fail open — create notification if settings can't be read
    }
}

/**
 * Create an admin notification (respects admin notification settings)
 */
export async function createAdminNotification(
    type: string,
    title: string,
    message: string,
    settingKey?: string
): Promise<void> {
    try {
        await connectDB();

        // If a settingKey is provided, check if this notification type is enabled
        if (settingKey) {
            const enabled = await isNotificationEnabled(settingKey);
            if (!enabled) {
                return; // Notification type is disabled, skip
            }
        }

        await Notification.create({
            type,
            title,
            message,
            isRead: false,
        });
    } catch (err) {
        // Don't let notification failures break the main flow
        console.error('Failed to create notification:', err);
    }
}

// ---- Convenience methods for common notification types ----

export async function notifyNewOrder(orderId: string, totalAmount: number, customerEmail?: string) {
    const customer = customerEmail || 'a customer';
    await createAdminNotification(
        'order',
        'New Order Received',
        `Order #${orderId.slice(-8).toUpperCase()} placed by ${customer} — SAR ${totalAmount.toLocaleString()}`,
        'orderNotifications'
    );
}

export async function notifyNewUser(userName: string, userEmail: string) {
    await createAdminNotification(
        'user',
        'New User Registered',
        `${userName} (${userEmail}) just created an account`,
        'newUserRegistrations'
    );
}

export async function notifyLowStock(productName: string, currentStock: number) {
    const severity = currentStock === 0 ? 'OUT OF STOCK' : `only ${currentStock} left`;
    await createAdminNotification(
        'inventory',
        `Low Stock Alert: ${productName}`,
        `${productName} is ${severity}. Consider restocking soon.`,
        'lowStockAlerts'
    );
}

export async function notifyQuoteRequest(companyName: string, productName?: string) {
    const product = productName ? ` for "${productName}"` : '';
    await createAdminNotification(
        'quote',
        'New Quote Request',
        `${companyName} submitted a quote request${product}`,
        'quoteRequests'
    );
}
