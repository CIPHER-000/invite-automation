# Domain-Wide Delegation Setup Guide

## Overview
Domain-Wide Delegation allows your Service Account to act on behalf of users in your Google Workspace organization, enabling calendar invite automation at scale.

## Prerequisites
- Google Workspace administrator access
- Your Service Account email from the credentials JSON
- Access to Google Admin Console

## Step 1: Get Service Account Client ID

Your Service Account details:
- **Service Account Email**: `inviteautomate@new-app-464423.iam.gserviceaccount.com`
- **Project ID**: `new-app-464423`

To get the **Client ID** (21-digit numeric string):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `new-app-464423`
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click on your service account: `inviteautomate@new-app-464423.iam.gserviceaccount.com`
5. In the **Details** tab, find the **Unique ID** field - this is your Client ID
6. Copy this 21-digit numeric Client ID

## Step 2: Configure Domain-Wide Delegation in Google Admin Console

1. **Access Google Admin Console**
   - Go to: https://admin.google.com
   - Sign in with your Google Workspace administrator account

2. **Navigate to API Controls**
   - Click "Security" in the left sidebar
   - Click "API controls"
   - Click "Domain-wide delegation"

3. **Add Service Account**
   - Click "Add new"
   - Enter your Service Account's **Client ID** (numeric value)
   - In the OAuth scopes field, add these exact scopes:
   ```
   https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/spreadsheets
   ```

4. **Authorize the Service Account**
   - Click "Authorize"
   - Confirm the delegation

## Step 3: Test Domain-Wide Delegation

The system will automatically use Domain-Wide Delegation once configured. Test by:

1. Creating a new campaign
2. Sending a test invite
3. The invite should be sent successfully without the "Domain-Wide Delegation" error

## Required OAuth Scopes Explained

- `https://www.googleapis.com/auth/calendar` - Full calendar access
- `https://www.googleapis.com/auth/calendar.events` - Create/modify calendar events  
- `https://www.googleapis.com/auth/spreadsheets` - Read Google Sheets data

## Security Considerations

- Domain-Wide Delegation grants broad permissions
- Only authorize trusted Service Accounts
- Regularly audit delegated permissions
- Monitor usage through Google Admin Console

## Troubleshooting

**Error: "Service accounts cannot invite attendees"**
- Verify Client ID is correct (numeric, not email)
- Confirm all three OAuth scopes are added
- Wait 10-15 minutes for delegation to propagate

**Error: "Access denied"**
- Ensure you're using a Google Workspace administrator account
- Check that the Service Account project has the necessary APIs enabled

## After Setup

Once Domain-Wide Delegation is configured:
- Calendar invites will be sent from the Service Account
- No individual user OAuth required
- System can scale to thousands of invites per day
- Full automation capability enabled

## Need Help?

If you encounter issues:
1. Double-check the Client ID (must be numeric)
2. Verify all three OAuth scopes are included
3. Wait 15 minutes for changes to propagate
4. Test with a simple calendar invite

---

**Next Steps**: After completing this setup, test the system by creating a campaign and sending an invite. The "Domain-Wide Delegation" error should be resolved.