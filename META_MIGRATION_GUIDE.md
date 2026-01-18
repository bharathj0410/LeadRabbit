# Meta Lead Ads Migration Guide

## Overview

This document outlines the migration from Facebook-specific lead handling to Meta Lead Ads, which supports both Facebook and Instagram leads.

## Changes Summary

### 1. Model Changes
- **File renamed**: `lib/models/FacebookLead.ts` → `lib/models/MetaLead.ts`
- **Interfaces renamed**:
  - `FacebookLeadField` → `MetaLeadField`
  - `FacebookLead` → `MetaLead`
  - `FacebookLeadForm` → `MetaLeadForm`
  - `FacebookPage` → `MetaPage`
- **Platform field updated**: Now accepts `"facebook" | "instagram"` instead of just `"facebook"`
- **CRMLead interface updated**: 
  - `facebookData` → `metaData`
  - Added `platform` field to `metaData`
  - `source` field now accepts `"facebook" | "instagram" | "manual" | "website" | "other"`

### 2. Database Collection Changes

#### Required Collection Renames:
- `facebook_pages` → `meta_pages`
- `facebook_leads` → `meta_leads`

#### Migration Script:

```javascript
// Run this in MongoDB shell or MongoDB Compass
use your_database_name;

// Rename collections
db.facebook_pages.renameCollection("meta_pages");
db.facebook_leads.renameCollection("meta_leads");

// Update leads collection to rename facebookData to metaData
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

// Verify the migration
db.meta_pages.countDocuments();
db.meta_leads.countDocuments();
db.leads.countDocuments({ metaData: { $exists: true } });
```

### 3. API Route Changes

All API routes have been updated to use the new Meta terminology:

- **Import statements**: Now use `MetaLead` from `@/lib/models/MetaLead`
- **Collection references**: Updated to use `meta_pages` and `meta_leads`
- **Function names**: `convertFacebookLeadToCRM` → `convertMetaLeadToCRM`
- **Data structures**: Use `metaData` instead of `facebookData` when storing CRM leads

Files updated:
- `app/api/webhook/facebook/route.ts`
- `app/api/facebook/sync/route.ts`
- `app/api/facebook/pages/route.ts`

### 4. UI Component Changes

- **Connectors page** (`app/admin/connectors/page.jsx`):
  - Title: "Facebook Lead Ads" → "Meta Lead Ads"
  - Description updated to mention both Facebook and Instagram
  - Function renamed: `syncFacebookLeads` → `syncMetaLeads`
  - Setup message updated to mention Facebook/Instagram pages

- **Configuration page** (`app/admin/configuration/page.jsx`):
  - Title: "Facebook Lead Ads" → "Meta Lead Ads"
  - Description updated to mention both platforms

### 5. Documentation Updates

- **FACEBOOK_INTEGRATION_SETUP.md**:
  - Title updated to "Meta Lead Ads Integration Setup Guide"
  - Updated to mention support for both Facebook and Instagram
  - Collection names updated in documentation
  - Flow diagrams updated to reflect Meta terminology
  - Features list updated to include platform detection

## Deployment Steps

### Step 1: Database Migration (IMPORTANT - Do this first!)

Before deploying the code changes, run the database migration script above to:
1. Rename collections
2. Update lead documents to use `metaData` instead of `facebookData`

### Step 2: Verify Database Migration

```javascript
// Check collections exist
db.getCollectionNames().filter(name => name.includes('meta'));
// Should return: ["meta_pages", "meta_leads"]

// Verify lead data migration
db.leads.findOne({ metaData: { $exists: true } });
// Should show lead with metaData field including platform

// Check for any remaining facebookData
db.leads.countDocuments({ facebookData: { $exists: true } });
// Should return: 0
```

### Step 3: Deploy Code Changes

After database migration is complete, deploy the updated code:

```bash
git add .
git commit -m "Migrate from Facebook Lead Ads to Meta Lead Ads (supports FB + Instagram)"
git push
```

### Step 4: Test Integration

1. **Test webhook endpoint**: Verify webhook still responds to Facebook
2. **Test sync functionality**: Run manual sync from connectors page
3. **Test new lead creation**: Create a test lead via Facebook Lead Ads
4. **Verify lead storage**: Check that new leads have correct `platform` field
5. **Test UI**: Verify all labels show "Meta Lead Ads"

## Backward Compatibility

The migration maintains backward compatibility:
- Existing webhook URLs remain unchanged (`/api/webhook/facebook`)
- Facebook OAuth flow remains the same
- All existing leads are migrated to use `metaData`
- API endpoints maintain their current paths

## Instagram Lead Ads Support

With this migration, the system now supports Instagram leads:

1. **Platform Detection**: The `platform` field automatically identifies the source
2. **Unified Processing**: Both Facebook and Instagram leads use the same webhook
3. **Source Tracking**: CRM leads have `source` set to either "facebook" or "instagram"
4. **Tags**: Leads are automatically tagged with platform-specific tags

## Rollback Plan

If issues arise, rollback steps:

```javascript
// Rollback database changes
use your_database_name;

// Rename collections back
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

Then deploy the previous code version.

## Support Notes

- Monitor webhook logs for any platform-specific issues
- Check that Instagram leads are properly tagged
- Verify that both Facebook and Instagram campaigns feed into the same pipeline
- Ensure access tokens have permissions for both platforms

## Questions?

If you encounter issues during migration, check:
1. Database connection is stable during migration
2. All collections were successfully renamed
3. No orphaned `facebookData` fields remain in leads collection
4. Webhook configuration in Facebook Developer console is still valid
