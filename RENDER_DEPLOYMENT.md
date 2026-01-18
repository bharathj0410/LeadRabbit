# Render Deployment Guide for LeadRabbit CRM

## MongoDB Atlas TLS Connection Fix

### Environment Variables for Render

Set these environment variables in your Render dashboard:

```bash
# MongoDB Connection (CRITICAL - TLS 1.2+ required for Atlas)
MONGODB_URI=mongodb+srv://leadrabbit:j49iO2uXoB3M2H8v@cluster0.tpeyhoc.mongodb.net/leadRabbit?retryWrites=true&w=majority&appName=Cluster0&ssl=true&authSource=admin&tls=true&tlsAllowInvalidCertificates=false

# Database Name
DB_NAME=leadRabbit

# JWT Secret
JWT_SECRET=SldUcGFzc3dvcmQ=

# App URLs (Replace with your actual Render URL)
NEXTAUTH_URL=https://leadrabbit.onrender.com
URL=https://leadrabbit.onrender.com
API=https://leadrabbit.onrender.com/api/

# Facebook Integration
FACEBOOK_CLIENT_ID=2228457047567922
FACEBOOK_CLIENT_SECRET=5cb33a7a28387987020e29a0119ca7b1
FACEBOOK_APP_SECRET=5cb33a7a28387987020e29a0119ca7b1
FACEBOOK_WEBHOOK_VERIFY_TOKEN=SldUcGFzc3dvcmQ=
USER_ACCESS_TOKEN=

# Google OAuth
GOOGLE_CLIENT_ID=1053171575533-s97h0f3qlcjvfn9dai20uv0b65chhn2v.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://leadrabbit.onrender.com/api/auth/google/callback

# Next Auth
NEXTAUTH_SECRET=SldUcGFzc3dvcmQ=

# Production
NODE_ENV=production
```

### MongoDB Atlas TLS Error Fix

If you're getting TLS errors like "tlsv1 alert internal error", try these solutions in order:

**Option 1: Standard SRV with explicit TLS 1.2+ (UPDATED)**
```
mongodb+srv://leadrabbit:j49iO2uXoB3M2H8v@cluster0.tpeyhoc.mongodb.net/leadRabbit?retryWrites=true&w=majority&appName=Cluster0&ssl=true&authSource=admin&tls=true&tlsAllowInvalidCertificates=false
```

**Option 2: Direct connection bypass SRV (RECOMMENDED for Render)**
Get the direct connection string from MongoDB Atlas:
1. Go to MongoDB Atlas → Clusters → Connect → Connect your application
2. Choose "Standard connection string (not recommended for production)"
3. Copy the connection string that looks like:
```
mongodb://leadrabbit:j49iO2uXoB3M2H8v@cluster0-shard-00-00.tpeyhoc.mongodb.net:27017,cluster0-shard-00-01.tpeyhoc.mongodb.net:27017,cluster0-shard-00-02.tpeyhoc.mongodb.net:27017/leadRabbit?ssl=true&replicaSet=atlas-xyz123-shard-0&authSource=admin&retryWrites=true&w=majority
```

**Option 3: Alternative MongoDB Atlas region**
Sometimes the issue is with the specific Atlas region. Try:
1. Create a new cluster in a different region (like us-east-1)
2. Migrate your data
3. Update the connection string

**Option 4: Use MongoDB Atlas Serverless**
Serverless instances sometimes have better TLS compatibility:
1. Create a new Serverless instance in Atlas
2. Use the serverless connection string format

3. **Check MongoDB Atlas Version:**
   - Ensure your cluster is MongoDB 4.4+ for better TLS compatibility
   - Update to latest cluster version if using older MongoDB

### MongoDB Atlas Setup

1. **CRITICAL: Ensure your MongoDB Atlas cluster allows connections from Render:**
   - Go to MongoDB Atlas → Network Access
   - Click "ADD IP ADDRESS"
   - Add `0.0.0.0/0` (Allow from anywhere) - **Required for Render**
   - Description: "Render deployment access"
   - Confirm and wait for the rule to become active (green status)

2. **Verify Render-specific network requirements:**
   - Render uses dynamic IP addresses, so `0.0.0.0/0` is required
   - Alternative: Add Render's IP ranges if you prefer more security:
     ```
     # Render IP ranges (check current ranges at render.com/docs)
     35.185.44.232/29
     35.225.197.40/29
     ```

3. **Verify your connection string format:**
   - ✅ Use `mongodb+srv://` (not `mongodb://`)
   - ✅ Include database name in the path: `/leadRabbit`
   - ✅ Include required TLS parameters: `&tls=true&tlsAllowInvalidCertificates=false`

4. **MongoDB Atlas Security:**
   - Ensure your database user has read/write permissions
   - Check that the password doesn't contain special characters that need URL encoding
   - Verify the user is assigned to the correct database (`leadRabbit`)

### Connection Test

After deployment, test the MongoDB connection:

```bash
curl https://your-render-url.onrender.com/api/debug/mongodb-test
```

### TLS/SSL Troubleshooting

If you still get TLS errors:

1. **Check MongoDB Atlas Version:**
   - Ensure you're using MongoDB 4.2+ (supports TLS 1.2+)

2. **Connection String Validation:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

3. **Network Issues:**
   - Render sometimes has issues with certain cloud providers
   - Try adding `&ssl=true&authSource=admin` to your connection string

4. **Alternative Connection String (if SRV fails):**
   ```
   mongodb://username:password@host1:27017,host2:27017/database?ssl=true&replicaSet=yourReplicaSet&authSource=admin
   ```

### Common Render + MongoDB Issues

1. **Timeout Errors:**
   - Our connection now uses longer timeouts (30s) for cloud environments
   - Connection pooling is optimized for Render's environment

2. **TLS Version:**
   - MongoDB Atlas requires TLS 1.2+
   - Our configuration enforces proper TLS settings

3. **Connection Pooling:**
   - Configured for 10 max connections in production
   - Automatic connection retry and heartbeat monitoring

### Deployment Commands

```bash
# Build command (Render)
npm run build

# Start command (Render)
npm start

# Health check endpoint
/api/debug/mongodb-test
```

### Monitoring

Monitor your MongoDB connections:
- Check Render logs for connection errors
- Use MongoDB Atlas monitoring for connection stats
- The `/api/debug/mongodb-test` endpoint provides detailed connection info

### Security Notes

- All TLS certificates are validated
- Connection uses encrypted connections only
- Credentials are hidden in server logs
- Connection retries are implemented for better reliability