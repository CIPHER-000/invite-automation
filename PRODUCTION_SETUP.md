# Production OAuth Setup Guide

## Issue Resolution
The production site at `https://invite.deploy2030.com` was showing "Service Account Required" errors because the OAuth redirect URI wasn't properly configured for the production domain.

## Solution Applied
Updated the Google OAuth service to automatically detect the correct redirect URI based on the deployment environment:

- **Development**: `https://6a2391b4-c08c-4318-89e8-f4587ae39044-00-3u78hq3a9p26b.worf.replit.dev/api/auth/google/callback`
- **Production**: `https://invite.deploy2030.com/api/auth/google/callback`

## Google Cloud Console Configuration Required

### 1. Add Production Redirect URI
In Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs:

Add these authorized redirect URIs:
```
https://invite.deploy2030.com/api/auth/google/callback
https://6a2391b4-c08c-4318-89e8-f4587ae39044-00-3u78hq3a9p26b.worf.replit.dev/api/auth/google/callback
```

### 2. Update Authorized Domains
In OAuth consent screen → Authorized domains:
```
deploy2030.com
replit.dev
```

### 3. Environment Variables (Optional)
You can also explicitly set the redirect URI via environment variable:
```
GOOGLE_REDIRECT_URI=https://invite.deploy2030.com/api/auth/google/callback
```

## Testing
After updating the Google Cloud Console settings:
1. Try connecting a Google account on production
2. The OAuth flow should work without service account errors
3. Accounts should appear in the OAuth Calendar Accounts section

## Current OAuth Configuration
- **Client ID**: 378868803078-50gj80qdtcji129idk73mb5kjtski9da.apps.googleusercontent.com
- **Project**: "Kally" 
- **Scopes**: Calendar, Sheets, Email, Profile

The system will automatically use the correct redirect URI for each environment.