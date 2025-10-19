# RegattaFlow Data Models Skill

## Overview

This skill teaches AI agents the RegattaFlow Supabase/PostgreSQL database patterns, security conventions, and query best practices. It ensures proper Row Level Security (RLS) implementation, efficient queries, and consistent migration patterns.

## What This Skill Covers

1. **RLS Patterns** - Four standard security patterns for multi-tenant data
2. **Migration Patterns** - Table creation, indexing, triggers, and constraints
3. **Query Patterns** - CRUD operations, joins, filtering, pagination
4. **Real-time Subscriptions** - Live data synchronization patterns
5. **Geographic Queries** - PostGIS integration for sailing venues
6. **Transaction Patterns** - RPC functions for atomic operations
7. **Type Safety** - TypeScript type generation and usage

## Token Savings

### Before (Without Skill):
Agent generates database code from scratch, often with RLS vulnerabilities or inefficient queries.
- Migration creation: ~2,000 tokens
- RLS policy setup: ~800 tokens
- Query service creation: ~1,200 tokens

### After (With Skill):
Agent references established patterns from skill documentation.
- Migration creation: ~600 tokens (reference template, modify for use case)
- RLS policy setup: ~200 tokens (reference pattern)
- Query service creation: ~400 tokens (reference template)

**Savings:** 60-75% reduction in generated code tokens

### Cost Impact (Projected)

```bash
Typical development session: 5 database operations (tables, queries, migrations)

Before: 5 × 1,600 tokens avg = 8,000 output tokens
After: 5 × 500 tokens avg = 2,500 output tokens

Savings per session: 5,500 tokens
Cost savings: 5.5k × $0.005/1k = $0.027 per session

Annual (50 sessions): 50 × $0.027 = $1.35/year
```

**Note:** Primary value is security correctness (RLS) and performance (indexing), not just cost savings.

## Resources

### Templates

1. **migration-template.sql** - Complete migration file structure
   - Table creation with proper constraints
   - Foreign key relationships
   - Comprehensive indexing strategy (5 types)
   - RLS policy setup
   - Utility functions
   - Security grants
   - Documentation comments
   - Testing queries

2. **rls-patterns.sql** - Four standard RLS security patterns
   - **Pattern 1**: User-Owned Data (sailor_boats, race_strategies)
   - **Pattern 2**: Public Read, Owner Write (boat_classes, venues)
   - **Pattern 3**: Junction Tables (race_registrations, coaching_sessions)
   - **Pattern 4**: Nested Ownership (race_marks inherit from races)
   - Performance optimization indexes
   - Testing queries
   - Common mistakes checklist

3. **query-examples.ts** - TypeScript service patterns
   - CRUD operations with proper error handling
   - Filtering and pagination
   - Joins and related data
   - Real-time subscriptions
   - Geographic queries (PostGIS)
   - Optimistic updates
   - Transaction patterns
   - Error handling utilities

### How to Use Templates

#### Creating a New Table (Migration)

1. Copy `migration-template.sql` to `supabase/migrations/YYYYMMDD_description.sql`
2. Update table name and columns for your use case
3. Choose appropriate RLS pattern from `rls-patterns.sql`
4. Add necessary indexes based on your query patterns
5. Test with the provided testing queries

**Example:**
```bash
# Copy template
cp skills/regattaflow-data-models/resources/templates/migration-template.sql \
   supabase/migrations/20251019_add_race_results_table.sql

# Edit migration
# - Change "example_items" to "race_results"
# - Update columns (race_id, sailor_id, finish_position, etc.)
# - Apply Pattern 4 RLS (nested ownership via races table)
# - Add indexes on race_id, sailor_id, finish_position
```

#### Creating a New Service (Queries)

1. Copy `query-examples.ts` to `src/services/YourService.ts`
2. Update types to match your table schema
3. Modify CRUD functions for your use case
4. Add any specialized queries (geographic, full-text search, etc.)

**Example:**
```bash
# Copy template
cp skills/regattaflow-data-models/resources/templates/query-examples.ts \
   src/services/RaceResultsService.ts

# Edit service
# - Change ExampleItem to RaceResult
# - Update CRUD functions for race_results table
# - Add specialized queries (getResultsByRace, getResultsByBoatClass, etc.)
```

## Integration with Development

### When Agent Uses This Skill

The AI agent automatically references this skill when:
- Creating new database tables
- Writing Supabase migrations
- Implementing RLS policies
- Building CRUD services
- Setting up real-time subscriptions
- Querying geographic data
- Handling database transactions

### Example Usage

**User Request:**
"Create a race_results table with RLS security"

**Without Skill:**
Agent generates ~2,000 tokens of SQL including:
- Table structure (may have issues)
- Missing or incorrect indexes
- Incomplete or insecure RLS policies
- No error handling examples

**With Skill:**
Agent references templates and conventions:
- "Use migration-template.sql as base"
- "Apply Pattern 4 RLS (nested ownership via races)"
- "Add composite index on (race_id, finish_position)"
- "Reference query-examples.ts for TypeScript service"

Output: ~600 tokens with references to established patterns

**Result:**
- Proper table structure with constraints
- Comprehensive indexes for performance
- Secure RLS policies (no vulnerabilities)
- Type-safe TypeScript service code

## Security Benefits

### RLS Policy Correctness

**Common Vulnerabilities Prevented:**

1. **Missing WITH CHECK on INSERT**
   ```sql
   -- ❌ WRONG (agent might generate this)
   CREATE POLICY "insert_policy" ON table FOR INSERT
     USING (auth.uid() = user_id);  -- USING doesn't work for INSERT!

   -- ✅ CORRECT (from skill)
   CREATE POLICY "insert_policy" ON table FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

2. **Ownership Transfer Vulnerability**
   ```sql
   -- ❌ WRONG (allows stealing data)
   CREATE POLICY "update_policy" ON table FOR UPDATE
     USING (auth.uid() = user_id)
     WITH CHECK (true);  -- Attacker can change user_id to steal ownership!

   -- ✅ CORRECT (from skill)
   CREATE POLICY "update_policy" ON table FOR UPDATE
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);  -- Prevents ownership transfer
   ```

3. **Missing Indexes on RLS Subqueries**
   ```sql
   -- ❌ SLOW (without skill - missing index)
   CREATE POLICY "nested_policy" ON child_table FOR SELECT
     USING (parent_id IN (SELECT id FROM parent WHERE user_id = auth.uid()));
   -- Performance: O(n²) without index on parent.user_id

   -- ✅ FAST (from skill - includes index)
   CREATE INDEX idx_parent_user_id ON parent(user_id);
   CREATE POLICY "nested_policy" ON child_table FOR SELECT
     USING (parent_id IN (SELECT id FROM parent WHERE user_id = auth.uid()));
   -- Performance: O(n log n) with index
   ```

## Performance Benefits

### Index Strategy

The skill teaches a comprehensive 5-type indexing strategy:

1. **Foreign Key Indexes** - Critical for RLS policy performance
2. **Query Optimization Indexes** - Common WHERE clause columns
3. **Composite Indexes** - Multi-column queries (user_id, status)
4. **Geographic Indexes** - PostGIS GIST indexes for location queries
5. **Full-Text Search Indexes** - GIN indexes for text search

**Impact:**
- RLS policy queries: 100-1000x faster with proper indexes
- List queries: 10-100x faster with composite indexes
- Geographic queries: Essential for sailing venue features

## Maintenance

### Updating This Skill

When database conventions change:

1. Update `skill.md` with new patterns
2. Update templates if structure changes
3. Add new RLS patterns as needed
4. Document breaking changes in README
5. Version the skill (see Version History below)

### Version History

- **v1.0** (2025-10-19): Initial creation with 4 RLS patterns and comprehensive templates

## Best Practices

### For Developers

1. **Always use RLS** - Enable on all tables containing user data
2. **Separate policies** - One policy per operation (SELECT/INSERT/UPDATE/DELETE)
3. **Index foreign keys** - Critical for RLS subquery performance
4. **Test with multiple users** - Verify RLS prevents cross-user access
5. **Use soft deletes** - Prefer status = 'archived' over DELETE for data retention

### For AI Agent

1. **Reference templates** - Don't generate from scratch
2. **Choose correct RLS pattern** - Match to use case (user-owned, public read, junction, nested)
3. **Include indexes** - Every foreign key, every WHERE clause column
4. **Validate types** - Use generated TypeScript types from Supabase
5. **Handle errors** - Follow error handling patterns from query-examples.ts

## Related Skills

- **regattaflow-frontend** - React Native/Expo UI patterns
- **sailing-document-parser** - Document extraction utilities
- **regattaflow-maplibre** - 3D visualization and GeoJSON generation

## Quick Reference

### Common Migration Tasks

**Add a new table:**
```bash
cp skills/regattaflow-data-models/resources/templates/migration-template.sql \
   supabase/migrations/$(date +%Y%m%d)_add_TABLE_NAME.sql
```

**Review RLS patterns:**
```bash
cat skills/regattaflow-data-models/resources/templates/rls-patterns.sql
```

### Common Service Tasks

**Create a new service:**
```bash
cp skills/regattaflow-data-models/resources/templates/query-examples.ts \
   src/services/YourService.ts
```

**Generate TypeScript types:**
```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```

### Testing Database Changes

**Apply migration locally:**
```bash
npx supabase db reset  # Resets local DB and applies all migrations
```

**Test RLS policies:**
```sql
-- In Supabase SQL Editor
SELECT set_config('request.jwt.claims', '{"sub": "user-uuid"}', true);
SELECT * FROM your_table;  -- Should only return user's data
```

---

**Maintained by:** RegattaFlow Development Team
**Last Updated:** 2025-10-19
