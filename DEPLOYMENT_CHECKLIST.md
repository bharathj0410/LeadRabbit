# Meta Lead Ads Migration - Deployment Checklist

## Pre-Deployment

### 1. Database Backup
- [ ] Create full database backup
- [ ] Test backup restoration process
- [ ] Document backup location and timestamp

### 2. Environment Check
- [ ] Verify MongoDB connection is stable
- [ ] Check all environment variables are set
- [ ] Confirm webhook URL is accessible
- [ ] Verify Facebook app credentials are valid

### 3. Review Changes
- [ ] Review all modified files
- [ ] Check for TypeScript/ESLint errors: `npm run lint`
- [ ] Verify no compilation errors: `npm run build`
- [ ] Review migration scripts

## Database Migration

### Step 1: Test in Development First
```javascript
// Connect to development database
use leadrabbit_dev;

// Test collection rename
db.facebook_pages.renameCollection("meta_pages_test");
db.meta_pages_test.renameCollection("facebook_pages"); // Revert

// If successful, proceed to production
```

### Step 2: Production Migration
```javascript
// Connect to production database
use leadrabbit_production; // or your DB name

// 1. Rename collections
db.facebook_pages.renameCollection("meta_pages");
db.facebook_leads.renameCollection("meta_leads");

// 2. Update leads collection
db.leads.updateMany(
  { facebookData: { $exists: true } },
  [
    {
      $set: {
        metaData: {
          leadId: "$facebookData.leadId",
          formId: "$facebookData.formId",
          pageId: "$facebookData.pageId",
          platform: "facebook",
          originalFields: "$facebookData.originalFields"
        }
      }
    },
    {
      $unset: "facebookData"
    }
  ]
);
```

### Step 3: Verification
```javascript
// Verify collections exist
db.getCollectionNames().filter(name => name.match(/meta_/));
// Should return: ["meta_pages", "meta_leads"]

// Check meta_pages
db.meta_pages.countDocuments();
db.meta_pages.findOne();

// Check meta_leads
db.meta_leads.countDocuments();
db.meta_leads.findOne();

// Verify lead migration
db.leads.findOne({ metaData: { $exists: true } });
// Should show lead with metaData containing platform field

// Ensure no orphaned facebookData
db.leads.countDocuments({ facebookData: { $exists: true } });
// Should return: 0
```

## Code Deployment

### Step 1: Pre-Deployment
- [ ] All tests pass
- [ ] Code review completed
- [ ] Migration guide reviewed
- [ ] Team notified of deployment

### Step 2: Deploy
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Migrate from Facebook to Meta Lead Ads - Add Instagram support"

# Push to repository
git push origin dev

# Deploy to production
# (Follow your deployment process)
```

### Step 3: Post-Deployment Verification
- [ ] Application starts without errors
- [ ] Check application logs for errors
- [ ] Verify no runtime errors

## Testing

### 1. API Endpoints
- [ ] Test webhook verification: `GET /api/webhook/facebook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=test`
- [ ] Test pages endpoint: `GET /api/facebook/pages`
- [ ] Test auth flow: Visit `/api/facebook/auth`

### 2. UI Testing
- [ ] Navigate to `/admin/connectors`
- [ ] Verify "Meta Lead Ads" title is displayed
- [ ] Check description mentions Facebook and Instagram
- [ ] Test enable/disable toggle
- [ ] Test sync button functionality
- [ ] Verify lead count displays correctly

### 3. Lead Processing
- [ ] Create test lead via Facebook Lead Ad form
- [ ] Verify webhook receives notification
- [ ] Check lead appears in `meta_leads` collection
- [ ] Verify lead converted to CRM format in `leads` collection
- [ ] Confirm `metaData` field has correct structure
- [ ] Verify `platform` field is set correctly
- [ ] Check tags include platform-specific tag

### 4. Manual Sync
- [ ] Click "Sync" button in connectors page
- [ ] Verify leads are fetched from Facebook
- [ ] Check progress/success message
- [ ] Confirm new leads added to database

## Monitoring

### Immediate (First Hour)
- [ ] Monitor application logs for errors
- [ ] Check webhook request logs
- [ ] Verify new leads are being processed
- [ ] Monitor database performance

### Short-term (First 24 Hours)
- [ ] Check lead conversion rate
- [ ] Verify all leads have platform field
- [ ] Monitor API response times
- [ ] Check for any integration errors

### Medium-term (First Week)
- [ ] Review lead data quality
- [ ] Verify Instagram leads (if applicable)
- [ ] Check for any data inconsistencies
- [ ] Monitor user feedback

## Rollback Plan

If critical issues arise:

### 1. Immediate Rollback
```bash
# Revert code changes
git revert HEAD
git push origin dev
# Redeploy previous version
```

### 2. Database Rollback
```javascript
// Revert collection names
use leadrabbit_production;

db.meta_pages.renameCollection("facebook_pages");
db.meta_leads.renameCollection("facebook_leads");

// Revert metaData to facebookData
db.leads.updateMany(
  { metaData: { $exists: true } },
  [
    {
      $set: {
        facebookData: {
          leadId: "$metaData.leadId",
          formId: "$metaData.formId",
          pageId: "$metaData.pageId",
          originalFields: "$metaData.originalFields"
        }
      }
    },
    {
      $unset: "metaData"
    }
  ]
);
```

### 3. Verification After Rollback
- [ ] Verify old collection names exist
- [ ] Check leads have facebookData field
- [ ] Test webhook functionality
- [ ] Verify UI shows old labels
- [ ] Confirm integration is working

## Communication

### Before Deployment
- [ ] Notify team of scheduled deployment
- [ ] Share expected downtime (if any)
- [ ] Prepare rollback communication template

### During Deployment
- [ ] Update team on progress
- [ ] Report any issues immediately
- [ ] Keep stakeholders informed

### After Deployment
- [ ] Confirm successful deployment
- [ ] Share test results
- [ ] Document any issues encountered
- [ ] Update team on new terminology

## Success Criteria

✅ Migration is successful if:
- All database collections renamed correctly
- All leads have metaData instead of facebookData
- No errors in application logs
- Webhook processes leads correctly
- UI displays Meta Lead Ads correctly
- Manual sync works as expected
- Platform field is populated correctly
- No data loss or corruption

## Issues & Resolution

| Issue | Resolution | Status |
|-------|-----------|---------|
| | | |

## Sign-off

- [ ] Database migration completed
- [ ] Code deployed successfully
- [ ] All tests passed
- [ ] Monitoring in place
- [ ] Team trained on new terminology
- [ ] Documentation updated

**Deployed By**: ________________  
**Date**: ________________  
**Time**: ________________  
**Verified By**: ________________  

## Notes

_Add any additional notes, observations, or lessons learned here:_

---

**Next Review**: Schedule review after 1 week to assess migration success
