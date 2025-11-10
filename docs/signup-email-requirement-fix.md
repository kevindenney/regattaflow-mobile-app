# Signup Email Requirement Fix

## Issue

User `club51kdenney` could create an account with just username and password, without providing an email address. This is incorrect - email should be required for account creation.

## Root Cause

The signup form (`app/(auth)/signup.tsx`) was missing an email field entirely. The `AuthProvider.signUp()` function was creating synthetic emails like `username@users.regattaflow.app`.

## Changes Made

### 1. Updated Signup Form (`app/(auth)/signup.tsx`)

**Added:**
- Email input field (marked as required with `*`)
- Email state management
- Email validation (required, proper format)
- Username minimum length validation (3 characters)

**Updated:**
- Subtitle text: "Pick a role, enter your details, and start sailing."
- Form now collects: Email, Username, Password, Persona
- All fields marked with `*` to indicate required
- Better error messages for validation failures

**New validation flow:**
```typescript
1. Email is required
2. Email must be valid format (regex validation)
3. Username is required
4. Username must be at least 3 characters
5. Password must be at least 6 characters
6. Persona selection (sailor/coach/club)
```

### 2. Updated AuthProvider (`providers/AuthProvider.tsx`)

**Changed `signUp` signature:**
```typescript
// BEFORE
signUp(username: string, password: string, persona: PersonaRole)

// AFTER
signUp(email: string, username: string, password: string, persona: PersonaRole)
```

**Added validation:**
- Email required and format validation
- Username minimum length (3 chars)
- Password minimum length (6 chars)
- All fields trimmed and validated

**Updated user profile creation:**
- Now stores real email address (not synthetic)
- Stores both `email` and `username` fields
- Proper error handling and logging

### 3. Backward Compatibility

**Login still works with old accounts:**
- Login page uses "Username or email" field
- `identifierToAuthEmail()` function converts username to email format
- Old accounts with synthetic emails (`club51kdenney@users.regattaflow.app`) can still log in with just username
- New accounts use real email addresses

## Testing

### New Account Creation
1. Navigate to `/signup`
2. Fill in all required fields:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `password123`
   - Persona: Select any role
3. Click "Create Account"
4. ✅ Account should be created with real email

### Validation Tests
1. Try submitting without email → Error: "Missing email"
2. Try invalid email format → Error: "Invalid email"
3. Try username < 3 chars → Error: "Username too short"
4. Try password < 6 chars → Error: "Weak password"

### Login with Old Accounts
1. Navigate to `/login`
2. Enter username: `club51kdenney`
3. Enter password
4. ✅ Should successfully log in (backward compatible)

### Login with New Accounts
1. Navigate to `/login`
2. Can use either:
   - Full email: `test@example.com`
   - OR username: `testuser`
3. ✅ Both should work

## Database Impact

### New User Records
Users created with the new signup flow will have:
```json
{
  "id": "uuid",
  "email": "real.email@example.com",  // Real email
  "username": "testuser",              // Display username
  "full_name": "testuser",
  "user_type": "club",
  "onboarding_completed": true
}
```

### Old User Records
Legacy users still have:
```json
{
  "id": "uuid",
  "email": "club51kdenney@users.regattaflow.app",  // Synthetic email
  "username": "club51kdenney",
  "user_type": "club"
}
```

Both formats are supported for login.

## Files Modified

1. ✅ `app/(auth)/signup.tsx` - Added email field and validation
2. ✅ `providers/AuthProvider.tsx` - Updated signUp signature and logic
3. ✅ No changes to login (already supports both email and username)

## Future Improvements

Consider:
1. Email verification flow (send verification email)
2. Password strength indicator
3. Username uniqueness check in real-time
4. Email uniqueness check in real-time
5. Migration script to convert synthetic emails to real ones (optional)
