import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // Token expires in 24 hours
  return expiry;
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!process.env.RESEND_API_KEY || !resend) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${verificationToken}`;

    const { error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'TuitionTrack <noreply@yourdomain.com>',
      to: [email],
      subject: 'Verify your TuitionTrack account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your TuitionTrack account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">TuitionTrack</h1>
            <p style="color: #dcfce7; margin: 10px 0 0 0;">Manage your tuitions with ease</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #374151; margin-top: 0;">Welcome to TuitionTrack, ${name}!</h2>
            
            <p style="color: #6b7280;">Thank you for registering with TuitionTrack. To complete your account setup and start managing your tuitions, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">If you can't click the button, copy and paste this link into your browser:</p>
            <p style="background: #f3f4f6; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 14px; color: #374151;">
              ${verificationUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This verification link will expire in 24 hours. If you didn't create an account with TuitionTrack, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, message: 'Failed to send verification email' };
    }

    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, message: 'Failed to send verification email' };
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: 'teacher' | 'student'
): Promise<{ success: boolean; message: string }> {
  try {
    if (!process.env.RESEND_API_KEY || !resend) {
      return { success: false, message: 'Email service not configured' };
    }

    const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard`;
    const roleSpecificContent = role === 'teacher' 
      ? {
          title: 'Start Managing Your Students',
          content: 'As a teacher, you can now create tuitions, track student progress, and generate reports.',
          cta: 'Go to Teacher Dashboard'
        }
      : {
          title: 'Track Your Learning Progress',
          content: 'As a student, you can now view your tuitions, track your progress, and stay connected with your teachers.',
          cta: 'Go to Student Dashboard'
        };

    const { error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'TuitionTrack <noreply@yourdomain.com>',
      to: [email],
      subject: 'Welcome to TuitionTrack! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to TuitionTrack</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to TuitionTrack!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #374151; margin-top: 0;">Hello ${name}!</h2>
            
            <p style="color: #6b7280;">Your email has been verified successfully! Welcome to the TuitionTrack community.</p>
            
            <h3 style="color: #10b981;">${roleSpecificContent.title}</h3>
            <p style="color: #6b7280;">${roleSpecificContent.content}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                ${roleSpecificContent.cta}
              </a>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #065f46; margin-top: 0;">Getting Started Tips:</h4>
              <ul style="color: #047857; margin: 0; padding-left: 20px;">
                ${role === 'teacher' ? `
                  <li>Create your first tuition by adding student details</li>
                  <li>Set up class schedules and track attendance</li>
                  <li>Generate progress reports for parents</li>
                ` : `
                  <li>Check your tuition schedules and upcoming classes</li>
                  <li>View your progress and attendance records</li>
                  <li>Stay connected with your teachers</li>
                `}
              </ul>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Need help getting started? Feel free to reach out to our support team.
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              You're receiving this email because you successfully verified your TuitionTrack account.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Welcome email error:', error);
      return { success: false, message: 'Failed to send welcome email' };
    }

    return { success: true, message: 'Welcome email sent successfully' };
  } catch (error) {
    console.error('Welcome email service error:', error);
    return { success: false, message: 'Failed to send welcome email' };
  }
}
