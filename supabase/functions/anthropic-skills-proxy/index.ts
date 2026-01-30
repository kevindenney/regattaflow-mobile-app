import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';

/**
 * Call Anthropic API directly using fetch
 * The SDK doesn't support the Skills beta API in Deno yet
 */
async function callAnthropicAPI(
  endpoint: string,
  method: string,
  body?: any,
  isMultipart: boolean = false
): Promise<any> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const headers: Record<string, string> = {
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'code-execution-2025-08-25,skills-2025-10-02,files-api-2025-04-14',
    'x-api-key': apiKey,
  };

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = isMultipart ? body : JSON.stringify(body);
  }

  const response = await fetch(`${ANTHROPIC_API_BASE}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Anthropic API error:', JSON.stringify(errorData));
    throw new Error(`Anthropic API error: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case 'list_skills':
        result = await callAnthropicAPI('/skills', 'GET');
        break;

      case 'get_skill':
        if (!params.skill_id) {
          throw new Error('skill_id required for get_skill action');
        }
        result = await callAnthropicAPI(`/skills/${params.skill_id}`, 'GET');
        break;

      case 'messages':
        // Invoke Claude with a skill
        if (!params.model || !params.messages) {
          throw new Error('model and messages required for messages action');
        }

        const requestBody: any = {
          model: params.model,
          max_tokens: params.max_tokens || 1024,
          messages: params.messages,
        };

        // Add container with skills if provided
        // Note: skills and code_execution are not supported by claude-3-haiku-20240307
        const modelSupportsSkills = !params.model?.includes('haiku');
        if (params.skills && params.skills.length > 0 && modelSupportsSkills) {
          requestBody.container = {
            skills: params.skills
          };

          requestBody.tools = [{
            type: 'code_execution_20250825',
            name: 'code_execution'
          }];
        }

        result = await callAnthropicAPI('/messages', 'POST', requestBody);
        break;

      case 'create_skill':
        if (!params.name || !params.description || !params.content) {
          throw new Error('name, description, and content required for create_skill action');
        }

        // Create SKILL.md file with proper YAML frontmatter
        const skillContent = `---
name: ${params.name}
description: ${params.description}
---

${params.content}`;

        // Generate display title from skill name
        const displayTitle = params.name.split('-').map((word: string) =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        // Import JSZip for creating ZIP files
        // @deno-types="npm:@types/jszip"
        const JSZip = (await import('npm:jszip@3.10.1')).default;

        // Create a ZIP file with top-level folder containing SKILL.md
        // Structure: skill.zip/skill-name/SKILL.md
        const zip = new JSZip();
        const skillFolder = zip.folder(params.name);
        if (!skillFolder) {
          throw new Error('Failed to create skill folder in ZIP');
        }
        skillFolder.file('SKILL.md', skillContent);

        // Generate ZIP as Uint8Array
        const zipBlob = await zip.generateAsync({ type: 'uint8array' });

        // Create multipart form data with ZIP file
        const formData = new FormData();
        formData.append('display_title', displayTitle);

        // Add the ZIP file
        const zipFile = new Blob([zipBlob], { type: 'application/zip' });
        formData.append('files[]', zipFile, 'skill.zip');

        // Call Anthropic API
        const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
        if (!apiKey) {
          throw new Error('ANTHROPIC_API_KEY not configured');
        }

        const response = await fetch(`${ANTHROPIC_API_BASE}/skills`, {
          method: 'POST',
          headers: {
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'code-execution-2025-08-25,skills-2025-10-02,files-api-2025-04-14',
            'x-api-key': apiKey,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Anthropic API error:', JSON.stringify(errorData));
          throw new Error(`Anthropic API error: ${JSON.stringify(errorData)}`);
        }

        result = await response.json();
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in anthropic-skills-proxy:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
