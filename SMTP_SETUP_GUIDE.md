# Gmail SMTP Setup Guide for TuitionTrack OTP System

This guide will help you set up Gmail SMTP credentials to send OTP emails in production.

## Prerequisites

- A Gmail account
- Two-factor authentication (2FA) enabled on your Gmail account

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on "2-Step Verification"
3. Follow the setup process to enable 2FA if not already enabled

### 2. Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on "2-Step Verification"
3. Scroll down and click on "App passwords"
4. Select "Mail" as the app and "Other (custom name)" as the device
5. Enter "TuitionTrack" as the custom name
6. Click "Generate"
7. **Copy the 16-character app password** (it will look like: `abcd efgh ijkl mnop`)

### 3. Set Environment Variables

Create a `.env.local` file in your project root (`tutiontrack` folder) and add:

```env
# Gmail SMTP Configuration
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
```

**Replace:**
- `your-email@gmail.com` with your actual Gmail address
- `your-16-character-app-password` with the app password you generated (remove spaces)

### 4. Example .env.local File

```env
# Gmail SMTP Configuration
SMTP_USER=johndoe@gmail.com
SMTP_PASS=abcdefghijklmnop
FROM_EMAIL=TuitionTrack <johndoe@gmail.com>

# Other environment variables...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## Important Security Notes

1. **Never commit `.env.local` to version control** - it's already in `.gitignore`
2. **Keep your app password secure** - treat it like a password
3. **Use different credentials for production** - create a separate Gmail account for production use

## Testing the Setup

1. Restart your development server: `npm run dev`
2. Try registering a new user
3. Check the email inbox for the OTP email
4. If you see console errors about authentication, double-check your credentials

## Production Deployment

For production (Vercel, Netlify, etc.):

1. Set the same environment variables in your hosting platform's dashboard
2. Consider using a dedicated email service like:
   - **Gmail** (free, but has sending limits)
   - **SendGrid** (free tier: 100 emails/day)
   - **Mailgun** (free tier: 5,000 emails/month)
   - **Amazon SES** (very cheap, pay-per-use)

## Troubleshooting

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"
- Make sure you're using the app password, not your regular Gmail password
- Verify 2FA is enabled on your account

### Error: "Missing credentials for PLAIN"
- Check that `SMTP_USER` and `SMTP_PASS` are set in your `.env.local` file
- Restart your development server after adding environment variables

### Error: "Connection timeout"
- Check your internet connection
- Some corporate firewalls block SMTP ports

## Alternative Free SMTP Services

If Gmail doesn't work for you, here are alternatives:

### SendGrid (Recommended for production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## Daily Sending Limits

- **Gmail**: ~500 emails per day
- **SendGrid Free**: 100 emails per day
- **Mailgun Free**: 5,000 emails per month

Choose based on your expected user registration volume.
