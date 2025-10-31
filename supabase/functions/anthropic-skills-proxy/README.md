# Anthropic Skills Proxy Edge Function

This Supabase Edge Function acts as a proxy for the Anthropic Skills API, solving CORS issues when calling the API from the browser.

## Features

- **List Skills**: Retrieve all available Claude Skills
- **Get Skill**: Retrieve a specific skill by ID
- **CORS Support**: Proper CORS headers for browser requests

## Deployment

### 1. Set the ANTHROPIC_API_KEY secret

```bash
npx supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2. Deploy the function

```bash
npx supabase functions deploy anthropic-skills-proxy
```

### 3. Verify deployment

```bash
npx supabase functions list
```

## Usage

The function accepts POST requests with a JSON body:

```typescript
// List all skills
const response = await fetch(`${supabaseUrl}/functions/v1/anthropic-skills-proxy`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'list_skills' })
});

// Get a specific skill
const response = await fetch(`${supabaseUrl}/functions/v1/anthropic-skills-proxy`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get_skill',
    skill_id: 'skill_id_here'
  })
});
```

## Supported Actions

- `list_skills`: List all available skills
- `get_skill`: Get a specific skill by ID (requires `skill_id` parameter)
- `create_skill`: NOT SUPPORTED (use Anthropic CLI instead for file uploads)

## Notes

- Creating skills with files is not supported via this proxy due to file upload limitations
- Use the [Anthropic CLI](https://github.com/anthropics/anthropic-sdk-typescript) to pre-upload skills
- Once uploaded, reference skills by their ID in your app
