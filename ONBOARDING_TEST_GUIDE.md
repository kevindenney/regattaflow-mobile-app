# Onboarding Fix Testing Guide

## Overview
This guide helps you test that new users are properly routed to onboarding after signup.

## Prerequisites
1. Make sure your app is running (`npm start` or `expo start`)
2. Have access to your Supabase dashboard or database
3. Have a test email account (or use a temporary email service)

---

## Test Scenario 1: Email/Password Signup (No Email Verification)

**Expected Behavior:** User should be immediately routed to onboarding after signup.

### Steps:
1. **Clear browser/app state** (optional but recommended):
   - Clear browser localStorage/sessionStorage
   - Or use incognito/private mode
   - Or clear app data if testing on mobile

2. **Navigate to signup page**:
   - Go to `/signup` or click "Sign Up"

3. **Fill out signup form**:
   - Select a persona (Sailor, Coach, or Club)
   - Enter a test email (e.g., `test-onboarding-${Date.now()}@example.com`)
   - Enter a username (e.g., "Test User")
   - Enter a password (minimum 6 characters)

4. **Click "Create Account"**

5. **Verify**:
   - ✅ You should be immediately redirected to the appropriate onboarding page:
     - Sailor → `/(auth)/sailor-onboarding-comprehensive`
     - Coach → `/(auth)/coach-onboarding-welcome`
     - Club → `/(auth)/club-onboarding-chat`
   - ✅ You should NOT be redirected to the dashboard
   - ✅ The onboarding page should load and display the first step

6. **Check database** (optional):
   ```sql
   SELECT id, email, user_type, onboarding_completed 
   FROM users 
   WHERE email = 'your-test-email@example.com';
   ```
   - ✅ `onboarding_completed` should be `false`
   - ✅ `user_type` should match the selected persona

---

## Test Scenario 2: Email/Password Signup (With Email Verification)

**Expected Behavior:** After clicking the email verification link, user should be routed to onboarding.

### Steps:
1. **Ensure email verification is enabled** in Supabase:
   - Go to Supabase Dashboard → Authentication → Settings
   - Check "Enable email confirmations"

2. **Sign up with a new email**:
   - Use a real email address you can access
   - Complete the signup form
   - Click "Create Account"

3. **Check your email**:
   - You should receive a verification email from Supabase
   - Click the verification link in the email

4. **Verify after email verification**:
   - ✅ You should be redirected to `/callback`
   - ✅ Then automatically redirected to the appropriate onboarding page
   - ✅ You should NOT be redirected to the dashboard

5. **Check database**:
   ```sql
   SELECT id, email, user_type, onboarding_completed 
   FROM users 
   WHERE email = 'your-verified-email@example.com';
   ```
   - ✅ `onboarding_completed` should be `false`
   - ✅ `user_type` should match the selected persona

---

## Test Scenario 3: OAuth Signup (Google/Apple)

**Expected Behavior:** After OAuth authentication, user should be routed to onboarding.

### Steps:
1. **Clear browser/app state** (important for OAuth testing)

2. **Navigate to signup page**

3. **Select a persona** (Sailor, Coach, or Club)

4. **Click "Continue with Google" or "Continue with Apple"**

5. **Complete OAuth flow**:
   - Authenticate with Google/Apple
   - Grant permissions if prompted

6. **Verify**:
   - ✅ You should be redirected to `/callback`
   - ✅ Then automatically redirected to the appropriate onboarding page
   - ✅ You should NOT be redirected to the dashboard

7. **Check database**:
   ```sql
   SELECT id, email, user_type, onboarding_completed 
   FROM users 
   WHERE email = 'your-oauth-email@example.com';
   ```
   - ✅ `onboarding_completed` should be `false`
   - ✅ `user_type` should match the selected persona

---

## Test Scenario 4: Existing User (Should Skip Onboarding)

**Expected Behavior:** Users who have already completed onboarding should go directly to dashboard.

### Steps:
1. **Sign in with an existing account** that has `onboarding_completed = true`

2. **Verify**:
   - ✅ You should be redirected directly to your dashboard
   - ✅ You should NOT see any onboarding pages

---

## Quick Database Verification

Run this query to check all recent signups and their onboarding status:

```sql
SELECT 
  email,
  user_type,
  onboarding_completed,
  created_at
FROM users
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Expected Results:**
- All new users should have `onboarding_completed = false`
- All new users should have a `user_type` set

---

## Troubleshooting

### Issue: User is redirected to dashboard instead of onboarding

**Check:**
1. Verify `onboarding_completed` is `false` in the database
2. Check browser console for any errors
3. Verify the user has a `user_type` set
4. Check if there are any redirect guards in `app/(auth)/_layout.tsx`

### Issue: User gets stuck on `/callback`

**Check:**
1. Look at browser console for errors
2. Check Supabase logs for authentication errors
3. Verify the callback logic in `app/(auth)/callback.tsx` is executing

### Issue: Onboarding page doesn't load

**Check:**
1. Verify the onboarding route exists:
   - `app/(auth)/sailor-onboarding-comprehensive.tsx`
   - `app/(auth)/coach-onboarding-welcome.tsx`
   - `app/(auth)/club-onboarding-chat.tsx`
2. Check for TypeScript/compilation errors
3. Check browser console for routing errors

---

## Cleanup Test Accounts

After testing, you may want to delete test accounts:

### Option 1: Via Supabase Dashboard
1. Go to Authentication → Users
2. Find and delete test users

### Option 2: Via SQL
```sql
-- First, delete from users table
DELETE FROM users WHERE email LIKE 'test-%@example.com';

-- Then delete from auth.users (requires admin access)
-- This is typically done via Supabase Dashboard or admin API
```

### Option 3: Use the Delete Account Feature
1. Sign in with the test account
2. Go to Settings → Delete Account
3. Follow the deletion flow

---

## Success Criteria

✅ **All new users** (email/password and OAuth) are routed to onboarding  
✅ **All new users** have `onboarding_completed = false` in database  
✅ **Existing users** with `onboarding_completed = true` skip onboarding  
✅ **Email verification flow** properly routes to onboarding  
✅ **All personas** (Sailor, Coach, Club) route to correct onboarding pages

---

## Notes

- If email verification is disabled in Supabase, Test Scenario 1 will apply
- If email verification is enabled, Test Scenario 2 will apply
- The fix ensures both flows work correctly
- OAuth users may need to select persona during signup (stored in localStorage)

