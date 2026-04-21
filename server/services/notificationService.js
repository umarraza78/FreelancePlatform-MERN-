const nodemailer = require('nodemailer');

// Mock Twilio client
const mockTwilioClient = {
    messages: {
        create: async ({ to, from, body }) => {
            console.log(`MOCK SMS to ${to}: ${body}`);
            return { sid: 'mock-sid-' + Date.now() };
        }
    }
};

// Email transport configuration
const emailTransporter = nodemailer.createTransport({
    // Configure with your email service
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Notification templates
const templates = {
    FREELANCER_VERIFICATION_APPROVED: {
        email: {
            subject: 'Verification Approved',
            body: (data) => `Congratulations! Your freelancer verification has been approved at ${data.level} level.`
        },
        sms: (data) => `Your freelancer verification has been approved at ${data.level} level.`
    },
    FREELANCER_VERIFICATION_REJECTED: {
        email: {
            subject: 'Verification Rejected',
            body: (data) => `Your freelancer verification request has been rejected. Please contact support for more information.`
        },
        sms: (data) => `Your freelancer verification has been rejected. Please check your email for more details.`
    }
};

class NotificationService {
    constructor() {
        this.emailTransporter = emailTransporter;
        this.twilioClient = mockTwilioClient;
        this.templates = templates;
    }

    async notify(user, templateName, data = {}) {
        try {
            if (!user || !user.email) {
                throw new Error('Invalid user data');
            }

            if (!this.templates[templateName]) {
                throw new Error('Template not found');
            }

            // Send email notification
            if (user.notificationPreferences?.email !== false) {
                await this.sendEmail(user.email, templateName, data);
            }

            // Send SMS notification if phone is available and SMS is enabled
            if (user.phone && user.notificationPreferences?.sms) {
                await this.sendSMS(user.phone, templateName, data);
            }
        } catch (error) {
            console.error('Notification error:', error);
            // Don't throw the error to prevent breaking the main flow
        }
    }

    async sendEmail(to, templateName, data) {
        const emailTemplate = this.templates[templateName].email;
        try {
            const info = await this.emailTransporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@freelanceplatform.com',
                to,
                subject: emailTemplate.subject,
                text: emailTemplate.body(data),
                html: emailTemplate.body(data)
            });
            return info;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }

    async sendSMS(to, templateName, data) {
        try {
            const smsTemplate = this.templates[templateName].sms;
            const message = await this.twilioClient.messages.create({
                body: smsTemplate(data),
                to,
                from: process.env.TWILIO_PHONE_NUMBER || '+1234567890'
            });
            return message;
        } catch (error) {
            console.error('SMS sending failed:', error);
            throw error;
        }
    }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
module.exports = notificationService; 