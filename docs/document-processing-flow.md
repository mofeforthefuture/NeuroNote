# Document Processing Flow: Deduplication & Content Extraction

## Design Philosophy

**Why document deduplication:**
- **Cost efficiency**: Don't re-process identical PDFs (saves AI API costs)
- **Speed**: Instant content for users uploading popular documents
- **Consistency**: Same document produces same extracted content
- **Scalability**: Popular academic PDFs processed once, shared across users

**Privacy-first approach:**
- Users still own their document records (RLS enforced)
- Each user gets their own copy of extracted content (can edit)
- Shared content is anonymous (no user attribution)
- Original PDF files remain private (stored per user)

---

## Processing Flow

### Step 1: Document Upload

**User Action**: Uploads PDF file

**System Actions**:
1. Validate file (size, format, security)
2. Store file in Supabase Storage: `{user_id}/{document_id}/original.pdf`
3. Generate SHA-256 hash of file content (not filename)
4. Create `documents` record with:
   - `user_id` (current user)
   - `title` (from filename or user input)
   - `file_path` (storage path)
   - `file_size`, `page_count` (metadata)
   - `content_hash` (SHA-256 hash)
   - `processing_status` = 'pending'

**Why hash file content, not filename:**
- Same PDF with different names should be detected
- Content-based deduplication is accurate
- Filenames can be misleading or changed

---

### Step 2: Hash Lookup (Deduplication Check)

**System Action**: Check if document hash exists

```typescript
// Pseudo-code
const existingDocument = await db
  .select('shared_content_id')
  .from('documents')
  .where('content_hash', hash)
  .first();

if (existingDocument?.shared_content_id) {
  // Hash exists, clone content
  return { action: 'clone', sharedContentId: existingDocument.shared_content_id };
} else {
  // New document, process with AI
  return { action: 'process' };
}
```

**Why check existing documents:**
- Fast lookup (indexed hash)
- If any user has processed this document, we can clone
- Saves AI processing time and cost

---

### Step 3A: Clone Existing Content (Hash Found)

**System Actions**:

1. **Find shared content**:
   ```sql
   SELECT * FROM shared_document_content 
   WHERE content_hash = :hash;
   ```

2. **Link document to shared content**:
   ```sql
   UPDATE documents 
   SET shared_content_id = :shared_content_id,
       processing_status = 'processing'
   WHERE id = :document_id;
   ```

3. **Clone topics** (create user's own copies):
   ```sql
   -- Get topics from first document with this hash
   INSERT INTO topics (document_id, title, description, page_references)
   SELECT :new_document_id, title, description, page_references
   FROM topics
   WHERE document_id = (
     SELECT id FROM documents 
     WHERE content_hash = :hash 
     LIMIT 1
   );
   ```

4. **Clone flashcards** (linked to cloned topics):
   ```sql
   INSERT INTO flashcards (topic_id, front_text, back_text, ...)
   SELECT new_topic.id, f.front_text, f.back_text, ...
   FROM flashcards f
   JOIN topics old_topic ON f.topic_id = old_topic.id
   JOIN topics new_topic ON new_topic.document_id = :new_document_id 
     AND new_topic.title = old_topic.title;
   ```

5. **Clone exam questions** (linked to cloned topics):
   ```sql
   INSERT INTO exam_questions (topic_id, question_type, question_text, ...)
   SELECT new_topic.id, q.question_type, q.question_text, ...
   FROM exam_questions q
   JOIN topics old_topic ON q.topic_id = old_topic.id
   JOIN topics new_topic ON new_topic.document_id = :new_document_id 
     AND new_topic.title = old_topic.title;
   ```

6. **Clone vocabulary** (linked to new document):
   ```sql
   INSERT INTO vocabulary_terms (document_id, term, definition, ...)
   SELECT :new_document_id, term, definition, ...
   FROM vocabulary_terms
   WHERE document_id = (
     SELECT id FROM documents 
     WHERE content_hash = :hash 
     LIMIT 1
   );
   ```

7. **Clone concept explanations** (linked to cloned topics):
   ```sql
   INSERT INTO concept_explanations (topic_id, explanation_level, explanation_text, ...)
   SELECT new_topic.id, e.explanation_level, e.explanation_text, ...
   FROM concept_explanations e
   JOIN topics old_topic ON e.topic_id = old_topic.id
   JOIN topics new_topic ON new_topic.document_id = :new_document_id 
     AND new_topic.title = old_topic.title;
   ```

8. **Update status**:
   ```sql
   UPDATE documents 
   SET processing_status = 'completed',
       processed_at = NOW()
   WHERE id = :document_id;
   ```

9. **Increment usage count** (trigger handles this automatically)

**Why clone instead of share:**
- Users can edit their own content (personalization)
- RLS policies work correctly (users see their own content)
- No cross-user data leakage
- Users feel ownership of their study materials

**Performance:**
- Cloning is fast (database operations only)
- No AI processing needed
- User sees content almost instantly

---

### Step 3B: Process New Document (Hash Not Found)

**System Actions**:

1. **Update status**:
   ```sql
   UPDATE documents 
   SET processing_status = 'processing'
   WHERE id = :document_id;
   ```

2. **Extract text from PDF**:
   - Use PDF.js or server-side PDF parser
   - Extract full text content
   - Extract page-by-page text (for page references)

3. **AI Processing** (OpenRouter API):
   - **Topic Identification**:
     - Prompt: "Identify key topics and concepts in this academic document"
     - Extract: Topic titles, descriptions, page references
   
   - **Flashcard Generation**:
     - Prompt: "Create flashcards for each topic"
     - Extract: Front/back text, difficulty levels
   
   - **Question Generation**:
     - Prompt: "Create practice questions (MCQ, short answer, true/false, essay)"
     - Extract: Questions, answers, explanations
   
   - **Vocabulary Extraction**:
     - Prompt: "Extract key terms with definitions, etymology, pronunciation"
     - Extract: Terms, definitions, context sentences
   
   - **Concept Explanations**:
     - Prompt: "Create ELI5, beginner, intermediate, and advanced explanations"
     - Extract: Multi-level explanations

4. **Store extracted content**:
   - Create `topics` records
   - Create `flashcards` records
   - Create `exam_questions` records
   - Create `vocabulary_terms` records
   - Create `concept_explanations` records

5. **Create shared content record**:
   ```sql
   INSERT INTO shared_document_content (
     content_hash,
     document_metadata,
     processing_version
   ) VALUES (
     :hash,
     :metadata, -- { title, page_count, etc }
     1
   );
   ```

6. **Link document to shared content**:
   ```sql
   UPDATE documents 
   SET shared_content_id = :shared_content_id,
       processing_status = 'completed',
       processed_at = NOW()
   WHERE id = :document_id;
   ```

**Why store in shared_document_content:**
- Enables future users to clone this content
- Tracks usage (how many users benefit)
- Allows re-processing with improved AI models (versioning)

---

## Hash Generation

### Implementation

```typescript
import crypto from 'crypto';
import fs from 'fs';

async function generateDocumentHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.promises.readFile(filePath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex');
}
```

**Why SHA-256:**
- Cryptographically secure (collision-resistant)
- Fast computation
- Standard algorithm (widely supported)
- 64-character hex string (easy to store/index)

**What gets hashed:**
- Full file content (all bytes)
- Not filename, not metadata, not upload date
- Only file content matters for deduplication

---

## Edge Cases & Considerations

### Case 1: Same PDF, Different Filenames

**Scenario**: User A uploads "Biology_101.pdf", User B uploads "bio-textbook.pdf" (same content)

**Solution**: Hash matches → Clone content (works correctly)

### Case 2: Same PDF, Slightly Modified

**Scenario**: User A uploads original PDF, User B uploads PDF with added watermark

**Solution**: Hash differs → Process separately (correct behavior, content is different)

### Case 3: Popular Academic PDF

**Scenario**: 100 users upload the same textbook PDF

**Solution**: 
- First user: Process with AI (cost: 1x)
- Next 99 users: Clone content (cost: 0x)
- **Cost savings**: 99% reduction in AI processing

### Case 4: User Edits Cloned Content

**Scenario**: User clones content, then edits flashcards

**Solution**: 
- User's edits only affect their copy (RLS enforced)
- Other users' content unchanged
- Shared content unchanged (read-only)

### Case 5: Improved AI Model

**Scenario**: New AI model produces better flashcards

**Solution**:
- Increment `processing_version` in `shared_document_content`
- Re-process document with new model
- Users can opt-in to new version (or keep old)

---

## Performance Optimizations

### Database Indexes

```sql
-- Fast hash lookup
CREATE UNIQUE INDEX idx_documents_content_hash ON documents(content_hash);

-- Fast shared content lookup
CREATE UNIQUE INDEX idx_shared_content_hash ON shared_document_content(content_hash);
```

**Why unique indexes:**
- Fast O(log n) lookup
- Prevents duplicate hashes
- Enforces data integrity

### Caching Strategy

- **Hash lookup**: Cache recent hash checks (Redis/Memory)
- **Shared content**: Cache popular shared content (frequently cloned)
- **Processing status**: Cache document status (reduce DB queries)

---

## Privacy & Security

### What's Shared

✅ **Shared (Anonymous)**:
- Extracted topics (titles, descriptions)
- Generated flashcards
- Practice questions
- Vocabulary terms
- Concept explanations

❌ **Not Shared (Private)**:
- Original PDF files (stored per user)
- User's document title (can differ)
- User's progress (mastery, reviews)
- User's notes
- User's edits to content

### RLS Enforcement

- Users can only see their own `documents` records
- Users can only see their own cloned `topics`, `flashcards`, etc.
- Users can read `shared_document_content` (for cloning) but not modify
- Original PDFs are private (RLS on storage)

---

## Monitoring & Analytics

### Metrics to Track

- **Deduplication rate**: % of uploads that clone vs. process
- **Cost savings**: AI processing costs avoided
- **Popular documents**: Most frequently cloned documents
- **Processing time**: Average time for clone vs. process
- **Error rate**: Failed clones or processing

### Queries

```sql
-- Deduplication rate
SELECT 
  COUNT(*) FILTER (WHERE shared_content_id IS NOT NULL) as cloned,
  COUNT(*) FILTER (WHERE shared_content_id IS NULL) as processed,
  COUNT(*) as total
FROM documents
WHERE processing_status = 'completed';

-- Most popular documents
SELECT 
  content_hash,
  usage_count,
  document_metadata->>'title' as title
FROM shared_document_content
ORDER BY usage_count DESC
LIMIT 10;
```

---

## Implementation Checklist

- [ ] Hash generation function (SHA-256)
- [ ] Hash lookup on upload
- [ ] Content cloning logic (topics, flashcards, questions, vocabulary, explanations)
- [ ] AI processing pipeline (if hash not found)
- [ ] Shared content creation
- [ ] Usage count tracking
- [ ] Error handling (failed clones, failed processing)
- [ ] User feedback (processing status, clone vs. process)
- [ ] Monitoring (deduplication rate, cost savings)

---

## Future Enhancements

### Version 2: Incremental Processing

- If document is 95% similar (fuzzy hash), clone and re-process only changed pages
- Reduces processing time for updated documents

### Version 3: Content Merging

- If user uploads similar document, offer to merge topics
- Useful for multiple editions of same textbook

### Version 4: Community Contributions

- Allow users to improve extracted content
- Best improvements become default for future clones
- Attribution system (optional)

---

## Design Principles Applied

1. **Efficiency**: Don't re-process identical content
2. **Privacy**: Users own their data, shared content is anonymous
3. **Performance**: Fast cloning, slow processing only when needed
4. **Scalability**: Popular documents processed once, shared many times
5. **Transparency**: Users see processing status (clone vs. process)

**Every optimization must:**
- Maintain privacy (RLS enforced)
- Preserve user ownership (editable content)
- Improve performance (faster, cheaper)
- Support learning (same quality content)

