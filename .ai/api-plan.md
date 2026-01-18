# REST API Plan

## 1. Resources

- **flashcards** - Core flashcard entities mapped to `flashcards` table
- **generation-sessions** - AI generation tracking mapped to `generation_sessions` table
- **generation-errors** - Error logging mapped to `generation_errors` table

Note: User management is handled entirely by Supabase Auth, not requiring custom API endpoints.

## 2. Endpoints

### 2.1. Flashcard Generation

#### Generate Flashcards proposals

- **Method**: POST
- **Path**: `/api/flashcards/generate-proposals`
- **Description**: Generate flashcards proposals from text using LLM
- **Request JSON**:

```json
{
  "source_text": "string (1000-10000 characters)"
}
```

- **Response JSON** (Success):

```json
{
  "generation_id": "uuid",
  "generated_count": "number",
  "flashcards_proposals": [
    {
      "front": "string (max 250 chars)",
      "back": "string (max 500 chars)",
      "source": "ai_generated"
    }
  ]
}
```

- **Validations**:
  - Source text must be between 1000-10000 characters
- **Business Logic**:
  - Create generation_session record with SHA-256 hash of source text
  - Call OpenRouter.ai API to generate flashcard proposals
  - Return proposals without saving (preview mode only)
- **Success Codes**: 200 OK
- **Error Codes**:
  - 400 Bad Request (invalid text length)
  - 429 Too Many Requests (rate limit)
  - 502 Bad Gateway (AI service error)
  - 401 Unauthorized

#### Save Generated Flashcards

- **Method**: POST
- **Path**: `/api/flashcards/save-generated-flashcards`
- **Description**: Save selected and optionally edited flashcards from generation session
- **Request JSON**:

```json
{
  "generation_id": "uuid",
  "flashcards": [
    {
      "front": "string (max 250 chars)",
      "back": "string (max 500 chars)",
      "source": "ai_generated" | "ai_edited"
    }
  ]
}
```

- **Response JSON** (Success):

```json
{
  "flashcards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "string",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ]
}
```

- **Validations**:
  - Session must exist and belong to the authenticated user
  - Front text maximum 250 characters
  - Back text maximum 500 characters
  - Source must be 'ai_generated' or 'ai_edited'. For manual creation there is separate endpoint
  - Flashcards with AI sources must have valid generation_id
- **Business Logic**:
  - Save selected flashcards to database with generation_id reference
  - Update generation_session with accepted_count and accepted_edited_count
  - Set updated_at timestamp automatically for database records
- **Success Codes**: 201 Created
- **Error Codes**:
  - 400 Bad Request (invalid session or data)
  - 404 Not Found (session not found)
  - 401 Unauthorized

### 2.2. Flashcard Management

#### Get User's Flashcards

- **Method**: GET
- **Path**: `/api/flashcards`
- **Description**: Retrieve paginated list of user's flashcards sorted by newest first
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 20, max: 100)
- **Response JSON** (Success):

```json
{
  "flashcards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "ai_generated" | "ai_edited" | "user_created",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "current_page": "number",
    "total_pages": "number",
    "total_items": "number",
    "limit": "number"
  }
}
```

- **Validations**:
  - User can only access their own flashcards (RLS enforcement)
  - Page must be >= 1
  - Limit must be between 1-100
- **Business Logic**:
  - Query user's flashcards ordered by created_at DESC (newest first)
  - Apply pagination using offset/limit with efficient indexing
- **Success Codes**: 200 OK
- **Error Codes**:
  - 400 Bad Request (invalid pagination parameters)
  - 401 Unauthorized

#### Create Flashcard Manually

- **Method**: POST
- **Path**: `/api/flashcards`
- **Description**: Create a single flashcard manually
- **Request JSON**:

```json
{
  "front": "string (max 250 chars, required)",
  "back": "string (max 500 chars, required)"
}
```

- **Response JSON** (Success):

```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "source": "user_created",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

- **Validations**:
  - Front text is required and maximum 250 characters
  - Back text is required and maximum 500 characters
- **Business Logic**:
  - Create flashcard with source 'user_created' and generation_id NULL
  - Set created_at and updated_at timestamps automatically
  - Link flashcard to authenticated user via user_id
- **Success Codes**: 201 Created
- **Error Codes**:
  - 400 Bad Request (validation errors)
  - 401 Unauthorized

#### Get Single Flashcard

- **Method**: GET
- **Path**: `/api/flashcards/{id}`
- **Description**: Retrieve a specific flashcard
- **Response JSON** (Success):

```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "source": "string",
  "created_at": "ISO 8601 timestamp"
}
```

- **Validations**:
  - User can only access their own flashcards (RLS enforcement)
  - Flashcard ID must be valid UUID format
  - Flashcard must exist in user's collection
- **Business Logic**:
  - Query single flashcard by ID with RLS filtering
- **Success Codes**: 200 OK
- **Error Codes**:
  - 404 Not Found
  - 401 Unauthorized

#### Update Flashcard

- **Method**: PUT
- **Path**: `/api/flashcards/{id}`
- **Description**: Update an existing flashcard
- **Request JSON**:

```json
{
  "front": "string (max 250 chars, required)",
  "back": "string (max 500 chars, required)"
}
```

- **Response JSON** (Success):

```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "source": "string",
  "created_at": "ISO 8601 timestamp"
}
```

- **Validations**:
  - User can only update their own flashcards (RLS enforcement)
  - Front text is required and maximum 250 characters
  - Back text is required and maximum 500 characters
- **Business Logic**:
  - Update only front and back text (source field remains unchanged)
  - Automatically update updated_at timestamp via database trigger
  - Preserve original creation metadata and generation_id
- **Success Codes**: 200 OK
- **Error Codes**:
  - 400 Bad Request (validation errors)
  - 404 Not Found
  - 401 Unauthorized

#### Delete Flashcard

- **Method**: DELETE
- **Path**: `/api/flashcards/{id}`
- **Description**: Delete a flashcard permanently
- **Response JSON** (Success): Empty
- **Validations**:
  - User can only delete their own flashcards (RLS enforcement)
  - Flashcard must exist in user's collection
- **Business Logic**:
  - Permanently delete flashcard from database (hard delete)
  - RLS policies ensure users can only delete their own flashcards
- **Success Codes**: 200 OK
- **Error Codes**:
  - 404 Not Found
  - 401 Unauthorized

## 3. Validation and Business Logic

### Flashcard Validation Rules

- **front**: Required, maximum 250 characters
- **back**: Required, maximum 500 characters
- **source**: Must be one of: 'ai_generated', 'ai_edited', 'user_created'
- **Business Rule**: User-created flashcards cannot have generation_id; AI-generated must have generation_id

### Generation Session Validation

- **sourceText**: Required, length between 1000-10000 characters
- **generated_count**: Must be >= 0
- **accepted_count + accepted_edited_count**: Must be <= generated_count

### Input Sanitization

- **HTML Encoding**: All text inputs are HTML-encoded to prevent XSS
- **SQL Injection**: Protected by Supabase parameterized queries
- **Text Length**: Enforced at API level before database operations

### Error Logging

- **Generation Errors**: Automatically logged to generation_errors table
- **API Errors**: Logged with user_id, endpoint, timestamp, and error details
- **Client Errors**: 4xx errors include user-friendly messages
- **Server Errors**: 5xx errors return generic messages while logging detailed information

### Business Logic Implementation

- **AI Generation Flow**:
  - Validate input text length
  - Create generation_session record
  - Call OpenRouter.ai API
  - Return preview without saving flashcards
  - Update session stats when flashcards are saved
