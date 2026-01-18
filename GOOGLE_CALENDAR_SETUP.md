# Google Calendar Integration Setup Guide

## Overview

This guide will help you set up the complete Google Calendar integration for your LeadRabbit application, allowing both admin and users to create meetings with Google Calendar.

## Current Implementation Status

### ✅ Completed Features

- **Complete OAuth Flow**: Server-side Google OAuth 2.0 implementation
- **API Routes**:
  - `/api/auth/google` - OAuth initiation
  - `/api/auth/google/callback` - OAuth callback handler
  - `/api/calendar/create-event` - Create calendar events
- **Reusable Components**:
  - `CreateMeetingButton` - Full Google Calendar integration
  - `SimpleMeetingModal` - Basic meeting creation (for testing)
- **Admin Integration**: Meeting creation in admin lead details
- **User Integration**: Meeting creation in user lead details
- **Calendar Page**: Full calendar management at `/admin/calendar`

### 🔧 Setup Required

#### 1. Google Cloud Console Setup

1. **Create a Google Cloud Project**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Note your project ID

2. **Enable Google Calendar API**:

   - Go to APIs & Services > Library
   - Search for "Google Calendar API"
   - Click and enable it

3. **Create OAuth 2.0 Credentials**:

   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:4000/api/auth/google/callback`
     - `https://yourdomain.com/api/auth/google/callback` (for production)
   - Download the JSON file

4. **Create Service Account** (for server-side operations):
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "Service Account"
   - Download the JSON key file
   - Share your Google Calendar with the service account email

#### 2. Environment Variables Setup

Update your `.env.local` file with the following:

```bash
# Existing variables...
MONGODB_URI=mongodb://localhost:27017/leadRabbit
DB_NAME=leadRabbit
JWT_SECRET=SldUcGFzc3dvcmQ=

# Google OAuth for Calendar Integration (Web Client)
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback

# Google Service Account (for server operations)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your-calendar@gmail.com
```

#### 3. Component Usage

**For Admin Users** (in AdminLeadDetailsContent.jsx):

```jsx
import CreateMeetingButton from "../../../components/CreateMeetingButton";
import SimpleMeetingModal from "../../../components/SimpleMeetingModal";

// In your component:
<div className="flex gap-2">
  <CreateMeetingButton
    leadName={lead.name || "Lead"}
    leadEmail={lead.email}
    onMeetingCreated={(event) => {
      console.log("Google Calendar meeting created:", event);
    }}
  />
  <SimpleMeetingModal
    leadName={lead.name || "Lead"}
    leadEmail={lead.email}
    onMeetingCreated={(meeting) => {
      console.log("Simple meeting created:", meeting);
    }}
  />
</div>;
```

**For Regular Users** (in LeadDrawerCard.jsx):

```jsx
// Same usage as admin, already implemented
```

## Testing the Integration

### 1. Test SimpleMeetingModal First

- This component works without Google OAuth setup
- Creates basic meeting records
- Good for UI testing

### 2. Test Google Calendar Integration

- Requires proper environment variables
- Users will be redirected to Google for authentication
- Creates actual calendar events

## Features

### CreateMeetingButton Features:

- ✅ Google OAuth 2.0 authentication
- ✅ Calendar event creation
- ✅ Attendee management
- ✅ Email invitations
- ✅ Event details (title, description, date, time)
- ✅ Error handling and validation
- ✅ Modal interface with HeroUI components

### SimpleMeetingModal Features:

- ✅ Basic meeting creation
- ✅ Form validation
- ✅ Date/time selection
- ✅ Duration and location settings
- ✅ No external dependencies
- ✅ Works immediately

## Troubleshooting

### Common Issues:

1. **"Create Meeting Button Not Working"**:

   - Check browser console for errors
   - Verify environment variables are set
   - Ensure Google APIs are enabled
   - Check OAuth redirect URIs

2. **Authentication Errors**:

   - Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   - Check redirect URI matches exactly
   - Ensure domain is authorized in Google Console

3. **Calendar Creation Fails**:
   - Check service account permissions
   - Verify calendar is shared with service account
   - Check GOOGLE_SERVICE_ACCOUNT_EMAIL and PRIVATE_KEY

### Debug Steps:

1. **Check Environment Variables**:

   ```bash
   # In your terminal
   node -e "console.log(process.env.GOOGLE_CLIENT_ID)"
   ```

2. **Test API Endpoints**:

   - Visit: `http://localhost:4000/api/auth/google`
   - Should redirect to Google OAuth

3. **Check Console Logs**:
   - Open browser developer tools
   - Check for JavaScript errors
   - Look for network request failures

## File Structure

```
components/
├── CreateMeetingButton.tsx     # Full Google Calendar integration
└── SimpleMeetingModal.tsx      # Basic meeting modal

app/
├── api/
│   ├── auth/google/
│   │   ├── route.ts           # OAuth initiation
│   │   └── callback/route.ts  # OAuth callback
│   └── calendar/
│       └── create-event/route.ts # Calendar event creation
├── admin/
│   ├── calendar/page.tsx      # Calendar management page
│   └── components/AdminLeadDetailsContent.jsx
└── user/components/LeadDrawerCard.jsx

lib/
└── googleOAuth.ts             # OAuth utilities
```

## Next Steps

1. **Set up Google Cloud credentials** using the guide above
2. **Update environment variables** with your actual credentials
3. **Test the SimpleMeetingModal** to ensure UI works
4. **Test Google Calendar integration** after credentials are set up
5. **Customize styling** and behavior as needed

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are correctly set
3. Ensure Google Cloud APIs are properly configured
4. Test with SimpleMeetingModal first to isolate issues

The integration is fully implemented and ready to use once the Google Cloud setup is completed!
