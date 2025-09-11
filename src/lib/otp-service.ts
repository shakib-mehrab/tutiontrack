import crypto from 'crypto';

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

// For development: Log OTP to console instead of sending email
export async function sendOTPConsole(
  email: string,
  name: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('='.repeat(50));
    console.log('📱 OTP VERIFICATION');
    console.log('='.repeat(50));
    console.log(`👤 Name: ${name}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`⏰ Valid for: 10 minutes`);
    console.log('='.repeat(50));
    console.log('Copy the OTP code above to verify your account');
    console.log('='.repeat(50));

    return { success: true, message: 'OTP generated and logged to console' };
  } catch (error) {
    console.error('OTP console log error:', error);
    return { success: false, message: 'Failed to generate OTP' };
  }
}

// Optional: SMS service integration (can be added later)
export async function sendOTPSMS(
  phoneNumber: string,
  name: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  // TODO: Integrate with SMS service like Twilio, AWS SNS, etc.
  console.log(`SMS OTP to ${phoneNumber}: ${otp}`);
  return { success: true, message: 'OTP sent via SMS (mock)' };
}

// Email-based OTP (free alternative to complex email templates)
export async function sendOTPEmail(
  email: string,
  name: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  // For now, just use console logging
  // In production, you can integrate with free email services or simple SMTP
  return await sendOTPConsole(email, name, otp);
}

// Verify OTP against database
export function verifyOTPCode(providedOTP: string, storedOTP: string): boolean {
  return providedOTP === storedOTP;
}

// Check if OTP has expired
export function isOTPExpired(expiryTime: Date): boolean {
  return new Date() > expiryTime;
}
