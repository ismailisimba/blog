import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY is not set in .env');
}

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL || 'noreply@example.com', // Change to your verified sender
    subject: 'Verify your email for Artsy Thoughts',
    text: `Please verify your email by clicking on this link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Artsy Thoughts!</h2>
        <p>Please verify your email address to complete your registration.</p>
        <p>
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error('Failed to send verification email');
  }
};
