import nodemailer from 'nodemailer';

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate OTP expiry time (10 minutes from now)
export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10); // OTP expires in 10 minutes
  return expiry;
}


// Optional: SMS service integration (can be added later)
export async function sendOTPSMS(): Promise<{ success: boolean; message: string }> {
  // TODO: Integrate with SMS service like Twilio, AWS SNS, etc.
  throw new Error('SMS service not implemented yet');
}

// Email-based OTP (production-ready SMTP delivery)
export async function sendOTPEmail(
  email: string,
  name: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if SMTP credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Your TuitionTrack OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>OTP Verification</h2>
          <p>Hello ${name},</p>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing: 2px;">${otp}</h1>
          <p>This code is valid for 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent via email' };
  } catch (error) {
    console.error('OTP email error:', error);
    return { success: false, message: 'Failed to send OTP email' };
  }
}



// Verify OTP against database
export function verifyOTPCode(providedOTP: string, storedOTP: string): boolean {
  return providedOTP === storedOTP;
}

// Check if OTP has expired
export function isOTPExpired(expiryTime: Date): boolean {
  return new Date() > expiryTime;
}
