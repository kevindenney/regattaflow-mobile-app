# AI Document Extraction Persistence

**Issue #3 Resolution**: AI-extracted course data now persists to database

## Overview

This implementation resolves the critical issue where AI-extracted race course data was lost after extraction. Now, all document processing results are saved to Supabase and can be retrieved across app restarts.

## Implementation

### Database Schema

Extended the `ai_analyses` table to support document extraction:

```sql
-- New column linking to sailing_documents
document_id UUID REFERENCES sailing_documents(id)

-- New analysis_type: 'document_extraction'
-- Stores: course_marks, course_layout, visualization, strategy_analysis
```

### Data Flow

1. **User uploads document** → Document text extracted
2. **AI Agent processes** → Extracts course, generates visualization, analyzes strategy
3. **Save to knowledge base** → Creates records in:
   - `sailing_documents` table (document metadata + course_data)
   - `ai_analyses` table (detailed extraction with analysis_type='document_extraction')

### Key Files

- **Migration**: `supabase/migrations/20251108_ai_document_extraction.sql`
- **Agent**: `src/services/agents/DocumentProcessingAgent.ts`

## Usage

### Saving Extractions (Automatic)

When a document is processed via the agent, extraction is automatically saved:

```typescript
const agent = new DocumentProcessingAgent();
const result = await agent.processSailingInstructions(
  documentText,
  'sailing-instructions.pdf',
  'hong-kong-victoria-harbour'
);

// Result includes:
// - result.saved.documentId
// - result.saved.analysisId
```

### Retrieving Saved Extractions

```typescript
import DocumentProcessingAgent from '@/src/services/agents/DocumentProcessingAgent';

// Get specific extraction
const { data, error } = await DocumentProcessingAgent.getExtraction(analysisId);

// Get all user's extractions (paginated)
const { data, error, count } = await DocumentProcessingAgent.getAllExtractions({
  limit: 20,
  offset: 0
});

// Delete extraction
const { success, error } = await DocumentProcessingAgent.deleteExtraction(analysisId);
```

### Extraction Data Structure

```typescript
{
  id: 'uuid',
  analysis_data: {
    course_marks: [...],        // Array of mark objects
    course_layout: {...},        // Layout type and description
    start_line: {...},           // Start line details
    finish_line: {...},          // Finish line details
    visualization: {...},        // GeoJSON for MapLibre
    strategy_analysis: {...},    // AI-generated strategic recommendations
    filename: 'string'
  },
  input_data: {
    filename: 'string',
    venue_id: 'string'
  },
  confidence_score: 0.85,        // 0.0-1.0
  created_at: 'timestamp',
  document_id: 'uuid',
  sailing_documents: {
    filename: 'string',
    title: 'string',
    course_data: {...},          // Simplified course data
    ai_analysis: {...}           // Visualization + strategy summary
  }
}
```

## Security

### Row Level Security (RLS)

All policies enforce user isolation:

```sql
-- Users can only access their own extractions
CREATE POLICY "Users can insert their own document extractions"
  ON ai_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id AND analysis_type = 'document_extraction');

CREATE POLICY "Users can view their own document extractions"
  ON ai_analyses FOR SELECT
  USING (auth.uid() = user_id AND analysis_type = 'document_extraction');
```

## Benefits

✅ **Persistent Data**: Course marks, visualizations, and strategies survive app restarts
✅ **Historical Access**: Review previously extracted documents
✅ **No Re-extraction**: Avoid redundant AI processing costs
✅ **Offline Support**: Cached data available without re-upload
✅ **Multiple Extractions**: Track multiple documents per race/venue

## Testing

To verify the implementation:

1. **Extract a course** from a sailing instruction document
2. **Check database** for new records in `ai_analyses` and `sailing_documents`
3. **Restart app** and retrieve extraction using `getExtraction()`
4. **Verify data** matches original extraction (marks, visualization, strategy)

## Migration Instructions

To apply the database migration:

```bash
# Via Supabase CLI
npx supabase migration up

# Or via Supabase MCP (if available)
mcp__supabase__apply_migration(name: "ai_document_extraction", query: "...")
```

## Future Enhancements

- [ ] Add course versioning (track updates to same document)
- [ ] Implement extraction caching layer (Redis/in-memory)
- [ ] Add extraction sharing between users
- [ ] Support duplicate detection (same course, different files)
- [ ] Add extraction quality scoring and user feedback
