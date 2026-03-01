# Google Calendar – Per-User OAuth Integration

## Overview

Each user (admin or employee) connects **their own** Google account.  
When they schedule a meeting with a lead, the event is created on **their personal Google Calendar** automatically.  
If a user hasn't connected Google, meetings are still saved in the database — just without calendar sync.

---

## How It Works

```
┌──────────┐    1. Click "Connect"     ┌──────────────┐
│   User   │ ──────────────────────►   │  LeadRabbit  │
│ (Browser)│                           │   Server     │
└──────────┘                           └──────┬───────┘
                                              │
                                   2. Generate OAuth URL
                                      (user identity in state)
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │   Google     │
                                       │   Consent    │
                                       │   Screen     │
                                       └──────┬──────┘
                                              │
                                   3. User approves access
                                              │
                                              ▼
┌──────────┐    4. Redirect back       ┌──────────────┐
│   User   │ ◄─────────────────────    │  LeadRabbit  │
│ (Browser)│                           │   Callback   │
└──────────┘                           └──────┬───────┘
                                              │
                                   5. Exchange code for tokens
                                   6. Store tokens in user's
                                      MongoDB document
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  MongoDB     │
                                       │  users.      │
                                       │  googleCal.. │
                                       └─────────────┘
```

### Meeting Creation Flow

```
User schedules meeting
        │
        ▼
Server receives request (POST /api/leads/:id/meetings)
        │
        ├── Authenticate user via JWT cookie
        │
        ├── Check: Does user have stored Google tokens?
        │       │
        │       ├── YES ──► Refresh token if expired
        │       │           Create event on user's Google Calendar
        │       │           Save meeting with googleEventId
        │       │
        │       └── NO ───► Save meeting without calendar event
        │                   (googleCalendarSynced = false)
        │
        ▼
Return meeting record to client
```

---

## API Endpoints

| Method   | Endpoint                              | Description                                      |
|----------|---------------------------------------|--------------------------------------------------|
| `GET`    | `/api/google-calendar/connect`        | Returns Google OAuth URL for the logged-in user   |
| `GET`    | `/api/google-calendar/callback`       | Handles OAuth callback, stores tokens             |
| `DELETE` | `/api/google-calendar/disconnect`     | Removes user's stored Google tokens               |
| `GET`    | `/api/google-calendar/status`         | Returns connection status (email, name, etc.)     |

### Connect

```
GET /api/google-calendar/connect?returnPath=/admin
```

- Requires authentication (JWT cookie)
- Encodes `customerId`, `email`, `role`, `returnPath` into the OAuth `state` parameter (base64)
- Returns `{ authUrl: "https://accounts.google.com/o/oauth2/..." }`

### Callback

```
GET /api/google-calendar/callback?code=...&state=...
```

- Called by Google after user grants consent
- Decodes `state` to identify the user
- Exchanges `code` for `access_token` + `refresh_token`
- Stores tokens in the user's document under `googleCalendar` field
- Redirects to `returnPath` with `?googleCalendarConnected=true`

### Disconnect

```
DELETE /api/google-calendar/disconnect
```

- Requires authentication
- Removes the `googleCalendar` field from the user document

### Status

```
GET /api/google-calendar/status
```

- Returns:
  ```json
  {
    "connected": true,
    "googleEmail": "user@gmail.com",
    "googleName": "John Doe",
    "connectedAt": "2026-03-01T10:00:00Z"
  }
  ```
  or `{ "connected": false }` if not connected.

---

## Data Model

Tokens are stored in each user's document inside their customer database:

```json
// users collection → user document
{
  "email": "employee@company.com",
  "role": "user",
  "googleCalendar": {
    "accessToken": "ya29.a0AfH6SM...",
    "refreshToken": "1//0eXy7z...",
    "expiresAt": "2026-03-01T11:00:00Z",
    "googleEmail": "employee@gmail.com",
    "googleName": "John Doe",
    "connectedAt": "2026-03-01T10:00:00Z"
  }
}
```

| Field          | Type     | Description                                      |
|----------------|----------|--------------------------------------------------|
| `accessToken`  | `string` | Short-lived Google access token (~1 hour)         |
| `refreshToken` | `string` | Long-lived token used to get new access tokens    |
| `expiresAt`    | `Date`   | When the access token expires                     |
| `googleEmail`  | `string` | The Google account email that was connected        |
| `googleName`   | `string` | Display name from the Google account               |
| `connectedAt`  | `Date`   | When the user first connected                      |

### Token Refresh

- Before any calendar operation, the server checks if `expiresAt` is within 5 minutes
- If expired, it uses `refreshToken` to get a new `accessToken` from Google
- The new token is saved back to the database automatically
- If the refresh fails (e.g., user revoked access in Google settings), the `googleCalendar` field is removed and the user must reconnect

---

## Meeting Record

When a meeting is created, it includes these calendar-related fields:

```json
{
  "_id": "ObjectId(...)",
  "title": "Meeting with Lead",
  "date": "2026-03-15",
  "startTimeLabel": "02:00 PM",
  "endTimeLabel": "03:00 PM",
  "googleEventId": "abc123xyz",
  "hangoutLink": "https://meet.google.com/...",
  "googleCalendarSynced": true,
  "status": "scheduled",
  "createdBy": "employee@company.com"
}
```

- `googleCalendarSynced: true` → event exists on the user's Google Calendar
- `googleCalendarSynced: false` → meeting saved locally only (user didn't connect Google)
- `googleEventId` → used for rescheduling/cancelling the calendar event later

---

## UI Components

### GoogleCalendarConnect

Located at `components/shared/GoogleCalendarConnect.jsx`.

| Prop             | Type       | Description                                    |
|------------------|------------|------------------------------------------------|
| `onStatusChange` | `function` | Called with `true/false` when status changes    |
| `compact`        | `boolean`  | `true` = inline indicator, `false` = full card  |

**Compact mode** (shown in meeting list header):
- Connected: ✅ `Calendar: user@gmail.com`
- Not connected: `[Connect Google Calendar]` button

**Full mode** (shown inside meeting creation modal):
- Connected: Green "Connected" chip + email + disconnect button
- Not connected: Description text + "Connect Google Calendar" button

---

## File Structure

```
lib/
  googleOAuthPerUser.ts        ← Core: OAuth, token storage, refresh, calendar CRUD

app/api/google-calendar/
  connect/route.ts             ← GET  – Generate OAuth URL
  callback/route.ts            ← GET  – Handle Google redirect, store tokens
  disconnect/route.ts          ← DELETE – Remove tokens
  status/route.ts              ← GET  – Check connection status

app/api/leads/[leadId]/
  meetings/route.ts            ← POST – Create meeting (uses per-user tokens)
  meetings/[meetingId]/route.ts ← PATCH/DELETE – Reschedule/cancel

components/shared/
  GoogleCalendarConnect.jsx    ← UI component for connect/disconnect

components/shared/leads/ui/
  LeadMeetingDetalsTable.jsx   ← Meeting list + creation modal
  MeetingHandlers.js           ← API call helpers for meetings
```

---

## Environment Variables

Only the **Web Client** OAuth credentials are needed (no service account):

```env
GOOGLE_CLIENT_ID=1053171575533-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX--xxxxx
GOOGLE_REDIRECT_URI=https://leadrabbit.onrender.com/api/google-calendar/callback
```

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services → Credentials**
4. Edit your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   https://leadrabbit.onrender.com/api/google-calendar/callback
   ```
6. Under **Authorized JavaScript origins**, ensure your domain is listed
7. Save

### Required Google APIs

Enable these in the Google Cloud Console:
- **Google Calendar API**
- **Google People API** (for user info)

---

## User Experience

### First Time (Not Connected)

1. User opens a lead detail → sees "Schedule & Track Meetings"
2. A small "Connect Google Calendar" button appears
3. User clicks it → redirected to Google → grants access → redirected back
4. Toast: "Google Calendar Connected"
5. Now when they create meetings, events appear on their Google Calendar

### Connected User

1. User sees ✅ `Calendar: user@gmail.com` in the meeting section
2. Creates a meeting → event auto-created on their Google Calendar
3. Reschedules → Google Calendar event updated
4. Cancels → Google Calendar event deleted
5. Can disconnect anytime via the full card in the modal

### Not Connected (Choosing to Skip)

1. User doesn't connect Google
2. Creates meetings normally — saved in database
3. Small note: "Meeting saved. Connect Google Calendar to auto-sync events."
4. Can connect later at any time — future meetings will sync

---

## Multi-Tenant Isolation

- Tokens are stored in each **customer's own database** (multi-tenant)
- User A from Customer X cannot access User B from Customer Y's tokens
- The OAuth `state` parameter carries `customerId` to ensure tokens go to the right database
- Each user's tokens are completely independent
