# Google Calendar Integration - Setup Guide

This implementation provides a complete Google Calendar integration for the LeadRabbit CRM system, allowing users to authenticate with Google and create calendar events directly from the application.

## 🚀 Features

- **OAuth 2.0 Authentication**: Secure Google sign-in using Google Identity Services
- **Calendar Event Creation**: Automatically create events with title, description, time, and attendees
- **Reusable Components**: Modular components for easy integration throughout the app
- **Error Handling**: Comprehensive error handling for authentication and API calls
- **Security**: All credentials stored in environment variables, secure token exchange
- **Admin Integration**: Built-in integration with the admin lead management system

## 📁 File Structure

```
├── lib/
│   └── googleOAuth.ts                    # Google OAuth utilities
├── app/
│   └── api/
│       ├── auth/google/
│       │   ├── route.ts                  # OAuth initiation endpoint
│       │   └── callback/route.ts         # OAuth callback handler
│       └── calendar/
│           └── create-event/route.ts     # Calendar event creation API
│   └── admin/
│       ├── calendar/page.tsx             # Full calendar management page
│       └── components/
│           ├── AdminLeadDetailsContent.jsx  # Updated with meeting button
│           └── navbar.tsx                # Updated with calendar nav
├── components/
│   └── CreateMeetingButton.tsx           # Reusable meeting creation component
└── .env.example                          # Environment variables template
```

## ⚙️ Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:4000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
5. Download the client configuration and note the Client ID and Client Secret

### 2. Environment Variables

Create a `.env.local` file in your project root:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback

# NextAuth Configuration (if using NextAuth)
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Existing MongoDB configuration
DB_NAME=leadRabbit
MONGODB_URI=your_mongodb_uri_here
```

### 3. Dependencies

The following dependencies are already included in your `package.json`:

- `googleapis` - Google APIs client library
- `@heroui/react` - UI components
- `@heroicons/react` - Icons

No additional installations needed!

## 🔧 Usage

### Basic Calendar Page

Navigate to `/admin/calendar` to access the full calendar management interface:

1. **Sign in with Google**: Click the "Sign in with Google" button
2. **Grant Permissions**: Allow access to Google Calendar
3. **Create Events**: Fill out the event form and create calendar events
4. **View Created Events**: See event details and direct links to Google Calendar

### Lead-Specific Meeting Creation

When viewing lead details in the admin panel:

1. **Access Lead Details**: Click "View Details" on any lead
2. **Create Meeting**: Click the "Create Meeting" button
3. **Google Authentication**: Sign in with Google (if not already authenticated)
4. **Event Details**: Form is pre-filled with lead information
5. **Automatic Invitation**: Lead email is automatically added as attendee

### Reusable Component

Use the `CreateMeetingButton` component anywhere in your app:

```jsx
import CreateMeetingButton from "@/components/CreateMeetingButton";

function YourComponent() {
  return (
    <CreateMeetingButton
      leadName="John Doe"
      leadEmail="john@example.com"
      onMeetingCreated={(event) => {
        console.log("Meeting created:", event);
        // Handle success
      }}
    />
  );
}
```

## 🔐 Security Features

### Environment Variables

- All sensitive credentials stored in environment variables
- No hardcoded secrets in the codebase
- Separate development and production configurations

### Token Handling

- Secure OAuth 2.0 flow
- Tokens passed through secure server-side API routes
- No client-side storage of sensitive tokens

### Error Handling

- Comprehensive error handling for all API calls
- User-friendly error messages
- Proper HTTP status codes

## 🛠️ API Endpoints

### Authentication

#### `GET /api/auth/google`

Initiates Google OAuth flow

- **Response**: `{ authUrl: string }`

#### `GET /api/auth/google/callback`

Handles OAuth callback

- **Query Params**: `code`, `error`
- **Redirects to**: `/admin/calendar` with auth data

### Calendar

#### `POST /api/calendar/create-event`

Creates a calendar event

- **Body**:
  ```json
  {
    "accessToken": "string",
    "title": "string",
    "description": "string",
    "startTime": "ISO string",
    "endTime": "ISO string",
    "attendees": ["email1@example.com"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "event": {
      "id": "string",
      "title": "string",
      "description": "string",
      "startTime": "ISO string",
      "endTime": "ISO string",
      "htmlLink": "string",
      "attendees": [...]
    }
  }
  ```

## 🎯 Integration Points

### Admin Lead Management

- **Lead Details Modal**: Includes "Create Meeting" button
- **Pre-filled Forms**: Lead name and email automatically populated
- **Seamless Flow**: Google auth handled within the lead management workflow

### Navigation

- **Admin Navbar**: Added "Calendar" link to main navigation
- **Breadcrumbs**: Proper navigation context maintained

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid OAuth credentials"**

   - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Check authorized redirect URIs in Google Cloud Console

2. **"Insufficient permissions"**

   - Ensure user grants calendar access during OAuth flow
   - Check Google Calendar API is enabled

3. **"Failed to create event"**
   - Verify date/time format (ISO 8601)
   - Check end time is after start time
   - Ensure valid email addresses for attendees

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_GOOGLE_CALENDAR=true
```

## 📈 Future Enhancements

- **Token Refresh**: Implement automatic token refresh for long-term usage
- **Database Storage**: Store user tokens securely in MongoDB
- **Bulk Operations**: Create multiple events or recurring meetings
- **Calendar Sync**: Two-way sync with Google Calendar
- **Meeting Templates**: Pre-defined meeting templates for different lead types
- **Timezone Support**: Better timezone handling for global users

## 🤝 Contributing

When extending this implementation:

1. Follow the existing error handling patterns
2. Use environment variables for all configuration
3. Add comprehensive logging for debugging
4. Update this documentation for new features
5. Test thoroughly with various Google account types

## 📄 License

This integration follows the same license as the main LeadRabbit project.
