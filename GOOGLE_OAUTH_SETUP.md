# How to Create Google OAuth Client ID & Secret

## Step 1: Go to Google Cloud Console
- Open [https://console.cloud.google.com](https://console.cloud.google.com)
- Sign in with any Google account (this will be the developer/owner account)

## Step 2: Create or Select a Project
1. Click the **project dropdown** at the top bar
2. Click **"New Project"**
3. Enter project name: `LeadRabbit`
4. Click **Create**
5. Make sure the new project is selected

## Step 3: Enable Required APIs
1. Go to **APIs & Services → Library** (left sidebar)
2. Search and enable these two:
   - **Google Calendar API** → Click → **Enable**
   - **Google People API** → Click → **Enable**

## Step 4: Configure OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → Click **Create**
3. Fill in:
   - **App name:** `LeadRabbit`
   - **User support email:** your email
   - **Developer contact email:** your email
4. Click **Save and Continue**
5. On **Scopes** page → Click **Add or Remove Scopes** → Add:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
6. Click **Save and Continue**
7. On **Test users** → Add any Gmail accounts you want to test with
8. Click **Save and Continue**

## Step 5: Create OAuth Credentials
1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Select **Application type:** `Web application`
4. **Name:** `LeadRabbit Web Client`
5. Under **Authorized JavaScript origins**, add:
   ```
   https://leadrabbit.onrender.com
   ```
   For local dev also add:
   ```
   http://localhost:3000
   ```
   And your ngrok URL (if using):
   ```
   https://your-ngrok-url.ngrok-free.app
   ```
6. Under **Authorized redirect URIs**, add:
   ```
   https://leadrabbit.onrender.com/api/google-calendar/callback
   ```
   For local dev:
   ```
   http://localhost:3000/api/google-calendar/callback
   ```
   And your ngrok URL (if using):
   ```
   https://your-ngrok-url.ngrok-free.app/api/google-calendar/callback
   ```
7. Click **Create**

## Step 6: Copy Credentials
After creation, Google shows:
- **Client ID** → something like `1234567890-xxxx.apps.googleusercontent.com`
- **Client Secret** → something like `GOCSPX--xxxx`

Copy these and update your `.env.local`:
```env
GOOGLE_CLIENT_ID=<paste Client ID here>
GOOGLE_CLIENT_SECRET=<paste Client Secret here>
GOOGLE_REDIRECT_URI=https://leadrabbit.onrender.com/api/google-calendar/callback
```

## Important Notes

- While the app is in **"Testing"** mode, only emails added as **Test users** (Step 4.7) can connect. Max 100 test users.
- To allow **any Google user** to connect, you need to submit for **Google verification** (APIs & Services → OAuth consent screen → **Publish App**). This requires a privacy policy URL and may take a few days.
- Every time your **ngrok URL changes**, you need to update both the redirect URI in Google Console and in `.env.local`.
