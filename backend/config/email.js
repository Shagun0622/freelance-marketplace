const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter
const getTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
        port: process.env.MAILTRAP_PORT || 2525,
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS
        }
    });
};

const transporter = getTransporter();

// Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send Welcome Email on Registration
const sendWelcomeEmail = async (email, name) => {
    const mailOptions = {
        from: `"Worklance" <${process.env.EMAIL_FROM || 'noreply@worklance.com'}>`,
        to: email,
        subject: 'Welcome to Worklance! 🎉',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Worklance</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; padding: 20px 0; background: linear-gradient(135deg, #0d9f6f, #0a7a55); border-radius: 10px 10px 0 0; }
                    .logo { font-size: 28px; font-weight: bold; color: white; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { 
                        display: inline-block; 
                        padding: 12px 24px; 
                        background-color: #0d9f6f; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        margin: 20px 0;
                    }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                    .feature { margin: 15px 0; padding: 10px; background: white; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">Worklance</div>
                    </div>
                    <div class="content">
                        <h2>Welcome to Worklance, ${name}! 👋</h2>
                        <p>We're excited to have you on board. You've joined India's fastest-growing freelance marketplace.</p>
                        
                        <div class="feature">
                            <h3>🚀 What you can do next:</h3>
                            <ul>
                                <li>Complete your profile to get more opportunities</li>
                                <li>Browse available gigs (freelancer) or post your first project (client)</li>
                                <li>Connect with top talent/clients</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.CLIENT_URL}/dashboard" class="button">Go to Dashboard</a>
                        </div>
                        
                        <p>Need help? Check out our <a href="#">Help Center</a> or contact support.</p>
                        <p>Happy freelancing!<br>The Worklance Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 Worklance. All rights reserved.</p>
                        <p>Worklance, India's #1 Freelance Marketplace</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
Welcome to Worklance, ${name}!

We're excited to have you on board. You've joined India's fastest-growing freelance marketplace.

What you can do next:
- Complete your profile to get more opportunities
- Browse available gigs (freelancer) or post your first project (client)
- Connect with top talent/clients

Go to Dashboard: ${process.env.CLIENT_URL}/dashboard

Need help? Contact our support team.

Happy freelancing!
The Worklance Team
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent to:', email);
        return true;
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error);
        return false;
    }
};

// Send verification email
const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: `"Worklance" <${process.env.EMAIL_FROM || 'noreply@worklance.com'}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Verify Email</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .button { 
                        display: inline-block; 
                        padding: 12px 24px; 
                        background-color: #0d9f6f; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Verify Your Email Address</h2>
                    <p>Please click the button below to verify your email:</p>
                    <div style="text-align: center;">
                        <a href="${verificationUrl}" class="button">Verify Email</a>
                    </div>
                    <p>Or copy this link: ${verificationUrl}</p>
                    <p>This link expires in 24 hours.</p>
                </div>
            </body>
            </html>
        `,
        text: `Verify your email by clicking this link: ${verificationUrl}`
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Failed to send verification email:', error);
        return false;
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: `"Worklance" <${process.env.EMAIL_FROM || 'noreply@worklance.com'}>`,
        to: email,
        subject: 'Reset Your Password',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reset Password</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .button { 
                        display: inline-block; 
                        padding: 12px 24px; 
                        background-color: #0d9f6f; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Password Reset Request</h2>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </div>
                    <p>This link expires in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            </body>
            </html>
        `,
        text: `Reset your password by clicking this link: ${resetUrl}`
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Failed to send reset email:', error);
        return false;
    }
};

module.exports = {
    transporter,
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    generateVerificationToken
};