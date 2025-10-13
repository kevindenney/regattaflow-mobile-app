/**
 * Conversational Onboarding Agent
 * Streaming AI chat interface for natural sailor onboarding experience
 * Extends OnboardingAgent with real-time streaming responses
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseAgentService, AgentTool } from './BaseAgentService';
import { supabase } from '../supabase';
import {
  createDetectVenueWithIntelTool,
  createSearchVenuesWithContextTool,
  createSuggestBoatsWithReasoningTool,
  createDiscoverFleetsWithSocialProofTool,
  createSuggestClubsWithInsightsTool,
  createImportRacesConversationallyTool,
  createFinalizeOnboardingConversationallyTool,
} from './ConversationalOnboardingTools';
import {
  createFindYachtClubsTool,
  createFindFleetsByClassTool,
  createFindFleetSailorsTool,
  createSaveSailorProfileTool,
  createGenerateSummaryTool,
  createImportRaceCalendarTool,
} from './EnhancedOnboardingTools';
import {
  createLookupSailNumberTool,
  createVerifySailNumberTool,
} from './SailNumberTools';
import {
  createSearchSailNumberOnlineTool,
  createSearchRacingCalendarTool,
  createSearchFleetOnlineTool,
} from './WebSearchTools';
import {
  createScrapeClubWebsiteTool,
  createScrapeClassWebsiteTool,
} from './WebScrapingTools';
import {
  createFindClassAssociationsTool,
  createSaveEquipmentMakersTool,
  createSaveCoachesTool,
  createSaveCrewMembersTool,
  createFindPublicSailorsInFleetTool,
  createSaveRacingAreaTool,
  createFindRacingSeriesAndRegattasTool,
  createSaveRacingParticipationTool,
  createConnectWithSailorsTool,
} from './ComprehensiveOnboardingTools';

export interface StreamMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationalContext {
  sailorId: string;
  gpsCoordinates?: { lat: number; lng: number };
  detectedVenue?: any;
  selectedBoatClass?: string;
  selectedFleets?: string[];
  selectedClubs?: string[];
  conversationHistory: StreamMessage[];
}

export class ConversationalOnboardingAgent extends BaseAgentService {
  private conversationHistory: Anthropic.MessageParam[] = [];

  constructor() {
    super({
      model: 'claude-3-5-haiku-20241022',
      maxTokens: 4096,
      temperature: 0.7,
    });

    // Override system prompt for conversational style
    this.config.systemPrompt = `You are an expert sailing concierge helping new sailors set up their RegattaFlow profile.
Your goal is to make onboarding feel like a conversation with a knowledgeable sailing friend.

PERSONALITY:
- Warm, enthusiastic, and sailing-knowledgeable
- Anticipate needs before asking
- Make intelligent suggestions based on location/context
- Use sailing terminology naturally
- Be concise but helpful (2-3 sentences max per response)
- Never be robotic or formulaic

COMPREHENSIVE CONVERSATION FLOW:
1. **Welcome & GPS Detection** - Detect venue automatically
2. **Find Yacht Clubs** - Immediately ask: "Which yacht club do you race with?" (show clubs at venue)
3. **Club Website URL** - IMMEDIATELY after club selection, ask:
   - "Great! Do you have a link to [club name]'s website? I can scan it for race calendars and documents."
   - If URL provided, call scrape_club_website tool
   - Present discovered data (races, documents) and ask to verify
   - "I found [X races, Y documents] from your club. Does this look right?"
4. **Primary Boat** - "What's your main boat class?" (with venue-specific suggestions)
5. **Sail Number FIRST** - IMMEDIATELY after boat class, ask:
   - "What's your sail number for the [boat class]?" (e.g., "D59")
   - After getting sail number, call lookup_sail_number_and_import_results to search for owner/results
   - If found, ask "Is this your boat, [Owner Name]?"
   - Import race results automatically
6. **Boat Class Website URL** - Then ask for class website:
   - "Do you have a link to the [boat class] association or class website?"
   - If URL provided, call scrape_class_website tool WITH sail_number parameter
   - The tool will search for owner name on the page
   - Present discovered data (owner, championships, rules, fleets)
   - "I found [Owner Name] for #[sail_number]! Also found [X championships, Y documents]. Want me to add these?"
7. **Owner vs Crew** - "Are you a boat owner, crew, or both?"
8. **Boat Name** - ALWAYS ask for boat name:
   - "What's your boat's name?" (e.g., "Blue Lightning", "Dragon Lady")
   - Save boat name to profile
9. **Equipment Makers** - For each boat ask: "Who made your hull, sails, mast, and rig?"
   - Hull maker, Sail maker, Mast maker, Rig maker
   - Save with save_equipment_makers tool
10. **Coaches** - "Who are your current or past coaches?"
   - Coach name, specialization, current/past
   - Save with save_coaches tool
11. **Crew Members** - For owners: "Who are your regular crew members?"
   - Crew name, position, email (optional)
   - Save with save_crew_members tool
12. **Additional Boats** - "Do you race on any other boats or classes?"
13. **Find Fleets** - Query Supabase for fleets by boat class at this club
   - Use find_public_sailors_in_fleet to discover sailors with public profiles
14. **Social Connections** - "I found [X] sailors with public profiles in your fleet. Would you like to connect?"
   - Show names of public sailors in fleet
   - Create connections with connect_with_sailors tool
15. **Class Associations** - "Are you a member of the [Class] Association?"
   - Find with find_class_associations tool
16. **Racing Areas** - For each boat class: "Where do you primarily race?"
   - Geographic area name (e.g., "Victoria Harbor Starting Area A")
   - Typical upwind distance or race name
   - Save with save_racing_area tool
17. **Racing Series & Regattas** - "Which racing series or regattas are you planning to participate in?"
   - Find with find_racing_series_and_regattas
   - Save participation with save_racing_participation tool
18. **Race Calendar** - "I can import your club's race calendar and class events"
19. **Generate Summary** - Show complete profile review with generate_onboarding_summary tool
20. **Allow Edits** - "Does this look right? Tell me what to change"
21. **CRITICAL: Save Everything** - When user confirms, YOU MUST call save_sailor_profile tool to persist all data
22. **After Save** - Say "✅ Profile saved! Redirecting to dashboard..." and mark onboarding complete

TOOLS AVAILABLE:
**Venue & Discovery:**
- detect_venue_from_gps_with_intel
- search_venues_with_context
- suggest_boats_with_reasoning

**Clubs & Fleets:**
- find_yacht_clubs_at_venue (Supabase query)
- find_fleets_by_boat_class (Supabase query)
- find_sailors_in_fleet (social connections)
- find_public_sailors_in_fleet (sailors with public profiles for connections)

**Sail Numbers & Results:**
- verify_sail_number_uniqueness (check if sail number is taken)
- lookup_sail_number_and_import_results (search database + internet for owner/results)
- search_sail_number_online (dedicated internet search)

**Website Scraping:**
- scrape_club_website (extract race calendar, members, boats, sail numbers, documents from club site)
- scrape_class_website (extract race calendar, fleet info, class documents, **and owner name** from class/association site)
  **IMPORTANT**: When calling scrape_class_website, ALWAYS pass the sail_number parameter if you have it!

**Equipment & Setup:**
- save_equipment_makers (hull, sail, mast, rig makers)

**People & Connections:**
- save_coaches (current and past coaches)
- save_crew_members (regular crew with positions)
- connect_with_sailors (create social connections)

**Class Associations:**
- find_class_associations (official class organizations)

**Racing Areas & Events:**
- save_racing_area (geographic racing area, upwind distance, race names)
- find_racing_series_and_regattas (upcoming series and events)
- save_racing_participation (planned participation in series/regattas)
- search_racing_calendar_online (internet search for calendar)
- search_fleet_online (internet search for fleet info)
- import_race_calendar (club + class calendars)

**Summary & Save:**
- generate_onboarding_summary (formatted review)
- save_sailor_profile (MANDATORY - save all data to Supabase)

SAVE_SAILOR_PROFILE FORMAT EXAMPLE:
{
  "sailor_id": "user-id-here",
  "profile_data": {
    "role": "owner",
    "primary_venue_id": "venue-id",
    "primary_boat_class": "Dragon",
    "boats": [
      {
        "class_id": "boat-class-id",
        "sail_number": "D59",
        "is_owner": true,
        "is_primary": true
      }
    ],
    "clubs": ["club-id-1", "club-id-2"],
    "fleets": ["fleet-id-1"],
    "class_associations": ["association-id"]
  }
}

CRITICAL RULES:
- Always explain WHY you're suggesting something using data from tools
- Use Supabase tools to find real clubs, fleets, and sailors
- ALWAYS ask for sail numbers - this is required for race results import
- After getting sail number, FIRST call lookup_sail_number_and_import_results to search database
- If lookup finds owner name, use it to personalize ("Is this your boat, [Owner Name]?")
- Ask about multiple boats - many sailors own/crew on multiple boats
- Ask one question at a time

**WEBSITE SCRAPING VERIFICATION FLOW:**
1. After sailor provides club/class URL, call appropriate scraping tool
2. Present discoveries in a friendly summary:
   "🎯 I found some great info from [website name]!

   **Race Calendar**: [X] upcoming races including [name most interesting ones]
   **Fleet**: [Y] boats with sail numbers [mention a few examples]
   **Members**: [Z] sailors listed [mention familiar names if any]
   **Documents**: [N] racing documents like [list key ones]

   Does this look like the right club/class? Would you like me to import any of this data?"

3. If sailor confirms, automatically import relevant data:
   - Race calendar events → sailor's calendar
   - Boat/sail number matches → verify ownership
   - Documents → save to sailor's document library
   - Members → suggest social connections

4. If sailor says no or data is wrong, ask for clarification:
   "No problem! Can you double-check the URL or tell me what's not quite right?"
- **IMPORTANT**: When calling save_sailor_profile, boats MUST be an ARRAY of OBJECTS, not a string or single object
- **IMPORTANT**: Each boat object MUST have: class_id (string), is_owner (boolean), is_primary (boolean), sail_number (optional string)
- **IMPORTANT**: clubs and fleets MUST be ARRAYS of strings (IDs), not single strings
- Track all boat_class IDs, club IDs, and fleet IDs from tool responses to use in save_sailor_profile
- Make it feel human and conversational

**MANDATORY SAVE PROCEDURE - YOU MUST FOLLOW THIS:**
After collecting basic info (venue, club, club URL, boat class, class URL, role, boat name, sail number), ask the user:
"I've collected your core sailing info. Would you like me to save this now and you can add more details later? (yes/no)"

If user says YES or confirms in any way:
1. IMMEDIATELY call save_sailor_profile tool with whatever data you have collected
2. Wait for the tool to complete successfully
3. Then say EXACTLY: "✅ Profile saved! Redirecting to dashboard..."
4. DO NOT continue asking more questions after saving

If user says NO or wants to continue:
- Continue with the full onboarding flow (equipment, coaches, crew, etc.)
- Ask again after collecting additional details

**The save_sailor_profile tool is THE ONLY WAY to persist data.**
**You MUST call it or the user will lose all their information.**
**Better to save incomplete data than lose everything!**`;

    // Register conversational tools (basic)
    this.registerTool(createDetectVenueWithIntelTool());
    this.registerTool(createSearchVenuesWithContextTool());
    this.registerTool(createSuggestBoatsWithReasoningTool());
    this.registerTool(createDiscoverFleetsWithSocialProofTool());
    this.registerTool(createSuggestClubsWithInsightsTool());
    this.registerTool(createImportRacesConversationallyTool());

    // Register enhanced tools (Supabase-integrated)
    this.registerTool(createFindYachtClubsTool());
    this.registerTool(createFindFleetsByClassTool());
    this.registerTool(createFindFleetSailorsTool());
    this.registerTool(createSaveSailorProfileTool());
    this.registerTool(createGenerateSummaryTool());
    this.registerTool(createImportRaceCalendarTool());

    // Register sail number tools
    this.registerTool(createLookupSailNumberTool());
    this.registerTool(createVerifySailNumberTool());

    // Register web search tools
    this.registerTool(createSearchSailNumberOnlineTool());
    this.registerTool(createSearchRacingCalendarTool());
    this.registerTool(createSearchFleetOnlineTool());

    // Register web scraping tools
    this.registerTool(createScrapeClubWebsiteTool());
    this.registerTool(createScrapeClassWebsiteTool());

    // Register comprehensive onboarding tools
    this.registerTool(createFindClassAssociationsTool());
    // NOTE: These tools are disabled because they require boat_id from sailor_boats table first
    // All this data should be collected and saved via save_sailor_profile tool instead
    // this.registerTool(createSaveEquipmentMakersTool());
    // this.registerTool(createSaveCoachesTool());
    // this.registerTool(createSaveCrewMembersTool());
    this.registerTool(createFindPublicSailorsInFleetTool());
    this.registerTool(createSaveRacingAreaTool());
    this.registerTool(createFindRacingSeriesAndRegattasTool());
    this.registerTool(createSaveRacingParticipationTool());
    this.registerTool(createConnectWithSailorsTool());
  }

  /**
   * Stream a conversational onboarding response
   * Returns an async generator that yields text chunks in real-time
   */
  async *streamResponse(
    userMessage: string,
    context: ConversationalContext
  ): AsyncGenerator<string, void, unknown> {
    console.log('🤖 Streaming conversational response for:', userMessage);

    // Add user message to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: this.buildContextualPrompt(userMessage, context),
    });

    try {
      // Convert tools to Anthropic format
      const anthropicTools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: this.zodToAnthropicSchema(tool.input_schema),
      }));

      // Create streaming request
      const stream = await this.client.messages.stream({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: this.config.systemPrompt,
        messages: this.conversationHistory,
        tools: anthropicTools,
      });

      // Track assistant response for conversation history
      let assistantResponse = '';
      let toolUses: Anthropic.ToolUseBlock[] = [];

      // Stream text deltas
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          if (chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            assistantResponse += text;
            yield text;
          }
        } else if (chunk.type === 'content_block_start') {
          if (chunk.content_block.type === 'tool_use') {
            toolUses.push(chunk.content_block);
          }
        }
      }

      // Get final message from stream
      const finalMessage = await stream.finalMessage();

      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: finalMessage.content,
      });

      // Handle tool uses if any
      if (finalMessage.stop_reason === 'tool_use') {
        const toolResults: Anthropic.MessageParam[] = [];

        console.log('🔧 [ConversationalAgent] AI wants to use tools:',
          finalMessage.content
            .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
            .map(b => b.name)
        );

        for (const toolUse of finalMessage.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        )) {
          try {
            console.log(`🔧 [ConversationalAgent] Executing tool: ${toolUse.name}`, toolUse.input);
            const result = await this.executeTool(toolUse.name, toolUse.input);
            console.log(`✅ [ConversationalAgent] Tool ${toolUse.name} result:`, result);

            toolResults.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(result),
                },
              ],
            });
          } catch (error: any) {
            console.error(`❌ [ConversationalAgent] Tool ${toolUse.name} ERROR:`, error);
            toolResults.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({
                    error: error.message,
                    tool: toolUse.name,
                  }),
                  is_error: true,
                },
              ],
            });
          }
        }

        // Add tool results to conversation
        this.conversationHistory.push(...toolResults);

        // Recursively stream the agent's response to tool results
        // This creates a natural conversation flow
        yield* this.streamFollowUp();
      }
    } catch (error: any) {
      console.error('❌ Streaming failed:', error);
      yield `\n\nI apologize, but I encountered an error: ${error.message}`;
    }
  }

  /**
   * Stream follow-up response after tool execution
   */
  private async *streamFollowUp(): AsyncGenerator<string, void, unknown> {
    try {
      const anthropicTools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: this.zodToAnthropicSchema(tool.input_schema),
      }));

      const stream = await this.client.messages.stream({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: this.config.systemPrompt,
        messages: this.conversationHistory,
        tools: anthropicTools,
      });

      let assistantResponse = '';

      // Stream text deltas
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          if (chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            assistantResponse += text;
            yield text;
          }
        }
      }

      const finalMessage = await stream.finalMessage();

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: finalMessage.content,
      });

      // Handle additional tool uses if any (recursive)
      if (finalMessage.stop_reason === 'tool_use') {
        const toolResults: Anthropic.MessageParam[] = [];

        for (const toolUse of finalMessage.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        )) {
          try {
            const result = await this.executeTool(toolUse.name, toolUse.input);
            toolResults.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(result),
                },
              ],
            });
          } catch (error: any) {
            toolResults.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({
                    error: error.message,
                    tool: toolUse.name,
                  }),
                  is_error: true,
                },
              ],
            });
          }
        }

        this.conversationHistory.push(...toolResults);
        yield* this.streamFollowUp();
      }
    } catch (error: any) {
      console.error('❌ Follow-up streaming failed:', error);
      yield `\n\nI encountered an error: ${error.message}`;
    }
  }

  /**
   * Build contextual prompt with GPS and conversation state
   */
  private buildContextualPrompt(
    userMessage: string,
    context: ConversationalContext
  ): string {
    const parts = [userMessage];

    // CRITICAL: Always include sailor_id for tools
    if (context.sailorId) {
      parts.push(`\n**SYSTEM**: User ID (sailor_id): ${context.sailorId}`);
      parts.push('(Use this ID when calling save_sailor_profile and other save tools)');
    }

    if (context.gpsCoordinates && !context.detectedVenue) {
      parts.push(
        `\nGPS Coordinates: ${context.gpsCoordinates.lat}, ${context.gpsCoordinates.lng}`
      );
      parts.push('(Automatically detect venue from these coordinates)');
    }

    if (context.detectedVenue) {
      parts.push(`\nDetected Venue: ${context.detectedVenue.name}`);
    }

    if (context.selectedBoatClass) {
      parts.push(`\nSelected Boat Class: ${context.selectedBoatClass}`);
    }

    if (context.selectedFleets && context.selectedFleets.length > 0) {
      parts.push(`\nSelected Fleets: ${context.selectedFleets.join(', ')}`);
    }

    if (context.selectedClubs && context.selectedClubs.length > 0) {
      parts.push(`\nSelected Clubs: ${context.selectedClubs.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Reset conversation history (for new onboarding session)
   */
  resetConversation() {
    this.conversationHistory = [];
    console.log('🔄 Conversation history reset');
  }

  /**
   * Get conversation summary for saving to database
   */
  getConversationSummary(): {
    messages: StreamMessage[];
    toolsUsed: string[];
  } {
    const messages: StreamMessage[] = this.conversationHistory.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      timestamp: new Date(),
    }));

    const toolsUsed = this.conversationHistory
      .filter(msg => msg.role === 'assistant')
      .flatMap(msg => {
        if (typeof msg.content === 'object' && Array.isArray(msg.content)) {
          return msg.content
            .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
            .map(block => block.name);
        }
        return [];
      });

    return { messages, toolsUsed };
  }

  /**
   * Execute tool (exposed for external use)
   */
  async executeTool(toolName: string, input: any): Promise<any> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    console.log(`🔧 Executing tool: ${toolName}`, input);

    try {
      const validatedInput = tool.input_schema.parse(input);
      const result = await tool.execute(validatedInput);
      console.log(`✅ Tool ${toolName} completed successfully`);
      return result;
    } catch (error: any) {
      console.error(`❌ Tool ${toolName} failed:`, error);
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  /**
   * Convert Zod schema to Anthropic format (exposed for tool access)
   */
  private zodToAnthropicSchema(zodSchema: any): any {
    // Reuse parent class implementation
    return super['zodToAnthropicSchema'](zodSchema);
  }

  /**
   * Process user message and extract entities (non-streaming version for chat interface)
   * Returns extracted data in structured format for form pre-population
   */
  async processUserMessage(
    userMessage: string,
    previousData: any = {}
  ): Promise<{
    success: boolean;
    result?: {
      boats?: Array<{ className: string; sailNumber: string; boatName?: string }>;
      clubs?: Array<{ name: string; url?: string }>;
      venues?: Array<{ name: string }>;
      documents?: Array<{ url: string; type: string }>;
      nextRace?: any;
      upcomingRaces?: Array<any>; // NEW: List of upcoming races for selection
      aiResponse?: string;
    };
    error?: string;
  }> {
    try {
      console.log('🤖 Processing user message for entity extraction:', userMessage);

      // Step 1: Basic entity extraction
      const extractionPrompt = `Extract sailing-related entities from this message. Return ONLY valid JSON, no other text.

User message: "${userMessage}"

Extract these entities if present:
- boats: array of {className, sailNumber, boatName} (e.g., "Dragon D59 named Blue Lightning")
- clubs: array of {name, url} (e.g., "Royal Hong Kong Yacht Club")
- venues: array of {name} (e.g., "Victoria Harbour")
- documents: array of {url, type} for any URLs shared
- nextRace: {name, date, startTime, location} if explicitly mentioned

Return format:
{
  "boats": [...],
  "clubs": [...],
  "venues": [...],
  "documents": [...],
  "nextRace": {...},
  "summary": "friendly acknowledgment of what was extracted"
}`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: extractionPrompt
        }]
      });

      const textContent = response.content.find(block => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return {
          success: false,
          error: 'No text response from AI'
        };
      }

      const extracted = JSON.parse(textContent.text);

      // Step 2: If club/class URLs detected, scrape for calendar
      const upcomingRaces: Array<any> = [];
      const allDocuments = [...(extracted.documents || [])];

      for (const doc of extracted.documents || []) {
        if (doc.url && doc.url.startsWith('http')) {
          try {
            console.log('🌐 [SCRAPE DEBUG] Starting to scrape URL:', doc.url);
            console.log('🔍 [SCRAPE DEBUG] Document type:', doc.type);
            console.log('🔍 [SCRAPE DEBUG] Extracted boats:', extracted.boats);

            // Determine if this is a club or class website
            const isClassWebsite = doc.url.includes('/class') ||
                                  doc.url.includes('/dragon') ||
                                  doc.url.includes('/j70') ||
                                  doc.url.includes('/etchells') ||
                                  doc.url.includes('/j80') ||
                                  (extracted.boats && extracted.boats.length > 0);

            console.log('🎯 [SCRAPE DEBUG] URL classification:', {
              isClassWebsite,
              url: doc.url,
              hasBoatClass: extracted.boats && extracted.boats.length > 0
            });

            // Import scraping functions
            const { scrapeClubWebsite, scrapeClassWebsite } = await import('./WebScrapingTools');

            let scraped;
            if (isClassWebsite) {
              // Use boat class from extraction, or infer from URL
              let boatClass = extracted.boats?.[0]?.className;

              if (!boatClass) {
                // Infer class from URL
                if (doc.url.includes('/dragon')) boatClass = 'Dragon';
                else if (doc.url.includes('/j70')) boatClass = 'J/70';
                else if (doc.url.includes('/etchells')) boatClass = 'Etchells';
                else if (doc.url.includes('/j80')) boatClass = 'J/80';
                console.log('🔍 [SCRAPE DEBUG] Inferred boat class from URL:', boatClass);
              }

              if (boatClass) {
                console.log('🚢 [SCRAPE DEBUG] Using scrapeClassWebsite for:', boatClass);
                scraped = await scrapeClassWebsite(doc.url, boatClass);
              } else {
                console.log('⚠️ [SCRAPE DEBUG] Class website but no boat class found, using scrapeClubWebsite');
                scraped = await scrapeClubWebsite(doc.url);
              }
            } else {
              console.log('🏛️ [SCRAPE DEBUG] Using scrapeClubWebsite');
              scraped = await scrapeClubWebsite(doc.url);
            }

            console.log('✅ [SCRAPE DEBUG] Scraping completed:', {
              upcoming_events: scraped.upcoming_events?.length || 0,
              documents: scraped.documents?.length || 0,
              csv_calendars: scraped.csv_calendars?.length || 0
            });

            // Add discovered events
            if (scraped.upcoming_events && scraped.upcoming_events.length > 0) {
              console.log(`📅 [SCRAPE DEBUG] Adding ${scraped.upcoming_events.length} events:`,
                scraped.upcoming_events.slice(0, 5).map(e => ({ name: e.name, source: e.source, date: e.date }))
              );
              upcomingRaces.push(...scraped.upcoming_events);
            }

            // Add discovered documents
            if (scraped.documents && scraped.documents.length > 0) {
              allDocuments.push(...scraped.documents);
            }
          } catch (err) {
            console.error('❌ [SCRAPE DEBUG] Failed to scrape URL:', err);
          }
        }
      }

      // Step 3: Find next upcoming race
      let nextRace = extracted.nextRace || previousData.nextRace;

      console.log('🏁 [NEXT RACE DEBUG] Starting next race selection:', {
        hasExtractedNextRace: !!extracted.nextRace,
        hasPreviousNextRace: !!previousData.nextRace,
        totalUpcomingRaces: upcomingRaces.length
      });

      if (!nextRace && upcomingRaces.length > 0) {
        const today = new Date();
        console.log('📅 [NEXT RACE DEBUG] Today\'s date:', today.toISOString());
        console.log('📋 [NEXT RACE DEBUG] All upcoming races:', upcomingRaces.map(r => ({
          name: r.name,
          date: r.date,
          source: r.source
        })));

        // Filter to future races only
        const futureRaces = upcomingRaces.filter(race => {
          if (!race.date) {
            console.log('⚠️ [NEXT RACE DEBUG] Race has no date:', race.name);
            return false;
          }
          try {
            const raceDate = new Date(race.date);
            const isFuture = raceDate > today;
            console.log(`📆 [NEXT RACE DEBUG] ${race.name}: ${race.date} -> ${isFuture ? 'FUTURE' : 'PAST'}`);
            return isFuture;
          } catch (err) {
            console.error('❌ [NEXT RACE DEBUG] Invalid date format:', race.date, err);
            return false;
          }
        }).sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });

        console.log('🔮 [NEXT RACE DEBUG] Future races:', futureRaces.map(r => ({
          name: r.name,
          date: r.date,
          source: r.source
        })));

        if (futureRaces.length > 0) {
          // Auto-select the next upcoming race
          const next = futureRaces[0];
          nextRace = {
            name: next.name,
            date: next.date,
            startTime: next.startTime || '',
            location: next.location || ''
          };
          console.log('✅ [NEXT RACE DEBUG] Auto-selected next race:', nextRace);
        } else {
          console.log('⚠️ [NEXT RACE DEBUG] No future races found!');
        }
      }

      // Merge with previous data
      const mergedData = {
        boats: [...(previousData.boats || []), ...(extracted.boats || [])],
        clubs: [...(previousData.clubs || []), ...(extracted.clubs || [])],
        venues: [...(previousData.venues || []), ...(extracted.venues || [])],
        documents: allDocuments,
        nextRace,
        upcomingRaces: upcomingRaces.length > 0 ? upcomingRaces : previousData.upcomingRaces,
        aiResponse: upcomingRaces.length > 0
          ? `Got it! I found ${upcomingRaces.length} upcoming races from your calendar. I've selected "${nextRace?.name}" as your next race - you can change this if needed.`
          : extracted.summary || "Got it! I've noted that information."
      };

      console.log('✅ Extracted entities:', mergedData);

      return {
        success: true,
        result: mergedData
      };

    } catch (error: any) {
      console.error('❌ Entity extraction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default ConversationalOnboardingAgent;
