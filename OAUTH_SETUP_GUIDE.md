# Google OAuth Setup and Verification Guide

## Current Status
Your OAuth application is working correctly, but Google shows an "unverified app" warning because the app hasn't been verified by Google yet.

## What the Warning Means
- **"Google hasn't verified this app"** - This is standard for development/testing OAuth apps
- **Safe to Continue** - Click "Advanced" → "Go to [your-app] (unsafe)" to proceed
- **No Security Risk** - Your credentials are secure, this is just Google's precaution for unverified apps

## For Development/Testing (Current State)
You can safely continue using the app by:
1. Click "Advanced" on the warning screen
2. Click "Go to [your-app-name] (unsafe)"
3. Complete the OAuth flow normally

## For Production Use
To remove this warning, you need to verify your app with Google:

### 1. OAuth Consent Screen Configuration
In Google Cloud Console → APIs & Services → OAuth consent screen:
- Set **User Type** to "External" (for public use) or "Internal" (for organization only)
- Fill out required fields:
  - App name: "Shady 5.0" or your preferred name
  - User support email: your email
  - Developer contact email: your email
  - App domain (optional): your domain
  - Privacy policy URL (required for verification)
  - Terms of service URL (required for verification)

### 2. Scope Configuration
Ensure these scopes are added:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

### 3. App Verification Process
For apps requesting sensitive scopes (like Calendar access):
1. Submit app for verification in Google Cloud Console
2. Provide privacy policy and terms of service URLs
3. Complete Google's security assessment
4. Wait for approval (can take several weeks)

### 4. Alternative: Internal Use Only
If this is for internal/organization use only:
- Set User Type to "Internal" in OAuth consent screen
- Only users in your Google Workspace organization can use it
- No verification required
- Warning still appears but only for external users

## Current OAuth Configuration
- **Client ID**: 378868803078-50gj80qdtcji129idk73mb5kjtski9da.apps.googleusercontent.com
- **Project**: "Kally" project
- **Scopes**: Calendar, Sheets, Email, Profile
- **Status**: Development/Testing (Unverified)

## Recommendation
For immediate use, continue with the "unsafe" option. For production deployment, consider the verification process or restrict to internal users only.