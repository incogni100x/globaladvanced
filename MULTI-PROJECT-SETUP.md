# Multi-Project Setup Guide

## Overview

This SQL script **works with your existing `verification_submissions` table**. It:

1. ✅ **Creates a NEW table** called `projects` (separate, for configuration)
2. ✅ **Adds a column** `project_id` to your **EXISTING** `verification_submissions` table
3. ✅ **Links them together** with a foreign key

## What Happens

### Your Existing Table (verification_submissions)
- **Gets a new column**: `project_id` 
- Existing records are set to `'globalpremiumfin'` (your current project)
- New records will require a `project_id`

### New Table (projects)
- **Separate configuration table**
- Stores: project_id → admin_email mapping
- Has 3 projects: capirocket, tradecenfxvip, globalpremiumfin

## Before Running

1. ✅ Your existing `verification_submissions` table remains intact
2. ✅ All existing data is preserved
3. ✅ Existing records get `project_id = 'globalpremiumfin'` automatically

## Running the SQL

**Step by step:**

1. Open Supabase SQL Editor
2. Run `multi-project-schema.sql`
3. The script will:
   - Create `projects` table (new)
   - Add `project_id` column to existing table
   - Set existing records to `'globalpremiumfin'`
   - Link them with foreign key
   - Create indexes

## After Running

### Existing Records
All existing verification submissions will have:
```sql
project_id = 'globalpremiumfin'
```

### New Records
Must include `project_id`:
```javascript
{
  project_id: 'capirocket',  // or 'tradecenfxvip', 'globalpremiumfin'
  ssn: '...',
  // ... rest of fields
}
```

## Testing

After running the SQL:

1. **Check projects table:**
   ```sql
   SELECT * FROM projects;
   ```
   Should show 3 rows.

2. **Check existing records:**
   ```sql
   SELECT project_id, COUNT(*) 
   FROM verification_submissions 
   GROUP BY project_id;
   ```
   Should show existing records with `project_id = 'globalpremiumfin'`.

3. **Test new submission:**
   - Submit a form with `project_id: 'capirocket'`
   - Email should go to `verify@capirocket.net`

## Troubleshooting

**If foreign key constraint fails:**
- Make sure `projects` table is created first
- Make sure existing records are updated (UPDATE statement runs)
- Check that all `project_id` values exist in `projects` table

**If you have existing NULL project_id values:**
- The UPDATE statement sets them to `'globalpremiumfin'`
- If you want different project, change the UPDATE statement

## Safety

✅ **Safe to run multiple times** - uses `IF NOT EXISTS` and `ON CONFLICT`
✅ **Won't delete existing data** - only adds columns and creates new table
✅ **Existing records preserved** - automatically assigned to `globalpremiumfin`

