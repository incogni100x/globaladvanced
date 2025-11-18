# Resend Email Setup Guide

## Current Error:
```
The globalpremiumfin.com domain is not verified. 
Please, add and verify your domain on https://resend.com/domains
```

## Quick Fix: Use Resend Test Domain (Temporary)

The Edge Function is now configured to use `onboarding@resend.dev` as the FROM email. This works immediately without domain verification.

**Note:** This is Resend's test domain. For production, you should verify your own domain.

## Setup Your Custom Domain (Recommended for Production)

### Step 1: Add Domain in Resend

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click **Add Domain**
3. Enter: `globalpremiumfin.com`
4. Click **Add**

### Step 2: Verify Domain with DNS Records

Resend will show you DNS records to add. Add these to your domain's DNS settings:

#### Example DNS Records:
```
Type: TXT
Name: @
Value: [provided by Resend]

Type: MX
Name: @
Value: feedback-smtp.resend.com (Priority: 10)

Type: CNAME
Name: resend._domainkey
Value: [provided by Resend]
```

### Step 3: Wait for Verification

- DNS propagation can take 24-48 hours
- Check status in Resend Dashboard
- You'll see a ✅ when verified

### Step 4: Update Edge Function Secret

Once verified, update the FROM email:

```bash
supabase secrets set VERIFICATION_EMAIL_FROM="Global Premium Fin Verification <verify@globalpremiumfin.com>"
```

Or redeploy the Edge Function with the verified email.

## Using Test Domain Now

**Current Setup (Working):**
- FROM: `onboarding@resend.dev` (Resend test domain)
- Works immediately
- Good for testing

**Production Setup (After Domain Verification):**
- FROM: `verify@globalpremiumfin.com`
- Set via: `supabase secrets set VERIFICATION_EMAIL_FROM="Global Premium Fin Verification <verify@globalpremiumfin.com>"`

## Verify Your Setup

1. **Check Secrets:**
   ```bash
   supabase secrets list
   ```
   
   Should show:
   - `RESEND_API_KEY`
   - `ADMIN_EMAIL`
   - `VERIFICATION_EMAIL_FROM` (optional, defaults to test domain)

2. **Test Email:**
   - Submit a verification form
   - Check your `ADMIN_EMAIL` inbox
   - Emails should arrive from `onboarding@resend.dev` (until domain verified)

## Troubleshooting

### Still getting domain error?
- Make sure you're using `onboarding@resend.dev` (not your custom domain)
- Check Resend Dashboard → Domains to see verification status
- Wait 24-48 hours after adding DNS records

### Emails not arriving?
- Check spam folder
- Verify `ADMIN_EMAIL` secret is set correctly
- Check Edge Function logs: `supabase functions logs send-verification-email`

### Want to use custom domain immediately?
- Use a verified subdomain: `verify@subdomain.globalpremiumfin.com`
- Or wait for main domain verification

## Next Steps

1. ✅ **Now:** Use test domain `onboarding@resend.dev` (already configured)
2. 📋 **Next:** Add domain to Resend and add DNS records
3. 🔄 **After verification:** Update `VERIFICATION_EMAIL_FROM` secret
4. ✉️ **Done:** Emails will send from `verify@globalpremiumfin.com`

