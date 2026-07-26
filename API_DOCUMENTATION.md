# 📚 RAG Chat — Complete API & MongoDB Documentation

## Table of Contents
1. [What is an API?](#1-what-is-an-api)
2. [HTTP Methods Explained](#2-http-methods-explained)
3. [All API Endpoints](#3-all-api-endpoints)
4. [Frontend → Backend Flow](#4-frontend--backend-flow)
5. [MongoDB Structure](#5-mongodb-structure)
6. [Variables Explained](#6-variables-explained)
7. [Complete Code Walkthrough with Examples](#7-complete-code-walkthrough-with-examples)

---

## 1. What is an API?

**API** = **A**pplication **P**rogramming **I**nterface

Think of it like a **restaurant waiter**:
- 🧑‍🍳 **Frontend (You)** = Customer who wants food
- 🧑‍💼 **API (Waiter)** = Takes your order to the kitchen
- 🍳 **Backend (Kitchen)** = Processes the order, prepares food
- 🍽️ **Response (Food)** = Returns the result to you

In our app:
- **Frontend** (React app at localhost:5173) wants to send a message
- **API** (FastAPI at localhost:8000) receives the request, processes it
- **Backend** (our Python code) searches documents, talks to Groq AI
- **Response** sends the AI answer + sources back to frontend

---

## 2. HTTP Methods Explained

### 📨 GET — "Give me data"
- Used when you **only want to READ data**, not change anything
- Like opening a book — you just read, you don't write in it
- Data travels in the **URL** itself

**Real life example:**
```
GET /api/conversations
```
> "Hey server, give me the list of all conversations"

### 📝 POST — "Create something new"
- Used when you want to **CREATE a new record**
- Data is sent in the **body** (hidden, not in URL)
- Like submitting a form to create a new account

**Real life example:**
```
POST /api/chat
Body: { "query": "What is AI?" }
```
> "Hey server, here's a question. Process it and give me an answer."

### ✏️ PUT — "Update something"
- Used when you want to **UPDATE/MODIFY** an existing record
- You specify **WHICH** record (by ID) and **WHAT** to change
- Like editing a document you already wrote

**Real life example:**
```
PUT /api/conversations/abc-123
Body: { "title": "New Title" }
```
> "Hey server, find conversation abc-123 and rename it to 'New Title'"

### 🗑️ DELETE — "Remove something"
- Used when you want to **DELETE** a record
- You specify **WHICH** record to delete (by ID)

**Real life example:**
```
DELETE /api/conversations/abc-123
```
> "Hey server, permanently delete conversation abc-123"

---

## 3. All API Endpoints

Our app has **6 API endpoints**. Here's every single one:

### 🔹 POST /api/chat — Send a message (The most important one!)

```javascript
// ─────────── WHAT THE FRONTEND SENDS ───────────
// Frontend code in services/api.ts sends this:
{
  "conversation_id": "abc-123-def",   // Optional — if null, creates new conversation
  "query": "What is attention mechanism?"  // The user's question
}

// ─────────── HOW BACKEND RECEIVES IT ───────────
// In server.py, this class catches the JSON:
class ChatRequest(BaseModel):    // BaseModel = Pydantic = automatic JSON parser
    conversation_id: Optional[str] = None  // Gets the conversation_id (or None)
    query: str                             // Gets the query text

// The function:
@app.post("/api/chat")
async def chat(request: ChatRequest):     // FastAPI automatically converts JSON → Python object
    conversation_id = request.conversation_id  // Access like an object property
    query_text = request.query                // Same here
    
    // ... RAG search happens ...
    // ... AI generates answer ...
    
    return ChatResponse(                  // Python automatically converts → JSON response
        conversation_id=conversation_id,
        run_id=run_id,
        answer=answer,
        sources=sources
    )

// ─────────── WHAT SERVER RESPONDS WITH ───────────
{
  "conversation_id": "abc-123-def",   // The conversation ID (new or existing)
  "run_id": "run-456-xyz",            // Unique ID for this Q&A pair
  "answer": "Attention is a mechanism that...",  // AI's answer
  "sources": [                        // Documents used for the answer
    { "document_name": "paper.pdf", "page": 5 },
    { "document_name": "book.pdf", "page": 12 }
  ]
}
```

### 🔹 GET /api/conversations — Get all conversations

```javascript
// ─────────── WHAT FRONTEND SENDS ───────────
// Nothing in body! Data is in the URL query parameter:
// GET /api/conversations?include_archived=false

// ─────────── HOW BACKEND RECEIVES IT ───────────
@app.get("/api/conversations")
async def get_conversations(include_archived: bool = False):
    // include_archived comes from URL: ?include_archived=true
    convs = ConversationModel.get_all(include_archived=include_archived)
    
// ─────────── WHAT SERVER RESPONDS WITH ───────────
[
  {
    "id": "conv-1",
    "title": "What is AI?",
    "created_at": "2026-06-06T12:00:00",
    "updated_at": "2026-06-06T12:05:00",
    "is_archived": false,
    "messages": [/* all messages from all runs flattened */]
  },
  {
    "id": "conv-2",
    "title": "Explain transformers",
    ...
  }
]
```

### 🔹 GET /api/conversations/{id} — Get one conversation

```javascript
// ─────────── WHAT FRONTEND SENDS ───────────
// Nothing in body! ID is in the URL:
// GET /api/conversations/abc-123-def

// ─────────── HOW BACKEND RECEIVES IT ───────────
@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    // conversation_id = "abc-123-def" (from the URL)
    conv = ConversationModel.get(conversation_id)
```

### 🔹 POST /api/conversations — Create empty conversation

```javascript
// ─────────── WHAT FRONTEND SENDS ───────────
{ "title": "My new chat" }

// ─────────── HOW BACKEND RECEIVES IT ───────────
class CreateConversationRequest(BaseModel):
    title: str

@app.post("/api/conversations")
async def create_conversation(request: CreateConversationRequest):
    conv_id = ConversationModel.create(request.title)
```

### 🔹 PUT /api/conversations/{id} — Update (rename/archive)

```javascript
// ─────────── WHAT FRONTEND SENDS ───────────
// PUT /api/conversations/abc-123-def
{ "title": "New name" }      // To rename
{ "is_archived": true }      // To archive

// ─────────── HOW BACKEND RECEIVES IT ───────────
class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None          // Optional = can be null/omitted
    is_archived: Optional[bool] = None

@app.put("/api/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, request: UpdateConversationRequest):
    ConversationModel.update(
        conversation_id,
        title=request.title,           // Could be None
        is_archived=request.is_archived  // Could be None
    )
```

### 🔹 DELETE /api/conversations/{id} — Delete conversation

```javascript
// ─────────── WHAT FRONTEND SENDS ───────────
// Nothing in body! Just the ID in URL:
// DELETE /api/conversations/abc-123-def

// ─────────── HOW BACKEND RECEIVES IT ───────────
@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    ConversationModel.delete(conversation_id)
```

---

## 4. Frontend → Backend Flow

```
                    POST /api/chat
                    ────────────>
  ┌─────────┐                     ┌──────────┐
  │         │   { "query":        │          │
  │ FRONTEND│     "What is AI?" } │ BACKEND  │
  │ :5173   │                     │ :8000    │
  │         │  <───────────────── │          │
  └─────────┘   { "answer": "..."  └──────────┘
                   "sources": [...] }       │
                                            │
                                            ▼
                                      ┌──────────┐
                                      │  MongoDB  │
                                      │ rag_chat  │
                                      │collection │
                                      └──────────┘
```

**Step-by-step when user clicks "Send":**

```
STEP 1: User types "What is machine learning?" and clicks Send
              │
              ▼
STEP 2: Frontend (App.tsx → handleSendMessage)
        • Creates a Message object: { id: "msg_123", role: "user", content: "..." }
        • Shows message in chat immediately (optimistic update)
        • Calls: chatApi.sendMessage({ query: "What is machine learning?" })
              │
              ▼
STEP 3: Frontend (services/api.ts)
        • Uses axios library to make HTTP POST request
        • URL: http://localhost:8000/api/chat
        • Body: { "query": "What is machine learning?" }
        • Headers: { "Content-Type": "application/json" }
              │
              ▼
STEP 4: Backend (server.py)
        • FastAPI receives the JSON
        • Pydantic automatically validates: ChatRequest(conversation_id=None, query="...")
        • Calls: rag_search.search_and_summarize(query)
        • Calls: ConversationModel.add_run(conv_id, run_id, query, answer, sources)
              │
              ▼
STEP 5: MongoDB (database.py)
        • ConversationModel.add_run() does:
          db.conversations.update_one(
            {"_id": conversation_id},
            {"$push": {"runs": run_entry}}
          )
        • This APPENDS a new run object to the runs array
              │
              ▼
STEP 6: Backend returns ChatResponse
        • FastAPI converts Python object → JSON
        • Returns: { "conversation_id": "...", "run_id": "...", "answer": "...", "sources": [...] }
              │
              ▼
STEP 7: Frontend receives response
        • App.tsx gets the response
        • Updates user message with run_id
        • Adds assistant message with the answer and sources
        • Scrolls to show new messages
```

---

## 5. MongoDB Structure

### Database: `rag_chat`
### Collection: `conversations`

Each document in the collection looks like this:

```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "What is machine learning?",
  "created_at": "2026-06-06T12:00:00.000000",
  "updated_at": "2026-06-06T12:05:30.000000",
  "is_archived": false,

  "runs": [
    {
      "run_id": "run-aaa-111",
      "query": "What is machine learning?",
      "answer": "Machine learning is a subset of artificial intelligence...",
      "sources": [
        {
          "document_name": "AI_Notes.pdf",
          "page": 3
        }
      ],
      "timestamp": "2026-06-06T12:00:15.000000"
    },
    {
      "run_id": "run-bbb-222",
      "query": "Explain neural networks",
      "answer": "Neural networks are computing systems...",
      "sources": [
        {
          "document_name": "Neural_Networks.pdf",
          "page": 7
        }
      ],
      "timestamp": "2026-06-06T12:05:30.000000"
    }
  ]
}
```

**Key Variables Explained:**

| Variable | Type | What it is |
|----------|------|------------|
| `_id` | string (UUID) | **Primary Key** — unique identifier for this conversation |
| `title` | string | Auto-generated from first question (first 50 chars + "...") |
| `created_at` | ISO datetime | When conversation was first created |
| `updated_at` | ISO datetime | When last message was sent (auto-updated) |
| `is_archived` | boolean | Whether user archived this conversation |
| `runs` | array | Array of Q&A pairs (each = one user question + AI answer) |
| `runs[].run_id` | string | Unique ID for this specific Q&A exchange |
| `runs[].query` | string | The user's question |
| `runs[].answer` | string | The AI's response |
| `runs[].sources` | array | Documents used to generate the answer |
| `runs[].sources[].document_name` | string | Filename of the source document |
| `runs[].sources[].page` | number | Page number in the document |
| `runs[].timestamp` | ISO datetime | When this Q&A exchange happened |

### How MongoDB Queries Work

```python
# ─────────── CREATE a conversation ───────────
def create(title):
    conv_id = str(uuid.uuid4())  # Generate unique ID
    conversations_collection.insert_one({
        "_id": conv_id,
        "title": title,
        "created_at": now,
        "updated_at": now,
        "is_archived": False,
        "runs": []               # Empty runs to start
    })
    return conv_id

# ─────────── READ (GET) a conversation ───────────
def get(conversation_id):
    doc = conversations_collection.find_one({"_id": conversation_id})
    # find_one() searches by _id — returns ONE document or None
    # This is like: SELECT * FROM conversations WHERE id = 'abc-123'

# ─────────── READ ALL conversations ───────────
def get_all(include_archived):
    query = {} if include_archived else {"is_archived": False}
    cursor = conversations_collection.find(query).sort("updated_at", -1)
    # find() returns ALL matching documents
    # .sort("updated_at", -1) = newest first
    # This is like: SELECT * FROM conversations ORDER BY updated_at DESC

# ─────────── UPDATE conversation ───────────
def update(conversation_id, title=None, is_archived=None):
    updates = {"updated_at": now}
    if title is not None:
        updates["title"] = title
    conversations_collection.update_one(
        {"_id": conversation_id},  # WHICH document to update
        {"$set": updates}          # WHAT fields to set
    )
    # $set = only update these fields, leave others unchanged

# ─────────── DELETE conversation ───────────
def delete(conversation_id):
    conversations_collection.delete_one({"_id": conversation_id})
    # Deletes the ENTIRE document including all runs

# ─────────── ADD NEW RUN to existing conversation ───────────
def add_run(conversation_id, run_id, query, answer, sources):
    run_entry = {
        "run_id": run_id,
        "query": query,
        "answer": answer,
        "sources": sources or [],
        "timestamp": now
    }
    conversations_collection.update_one(
        {"_id": conversation_id},
        {
            "$push": {"runs": run_entry},  # APPEND to the runs array
            "$set": {"updated_at": now}    # Also update timestamp
        }
    )
    # $push = add this element to the array (like Python's list.append())
    # After this, the runs array has one MORE element
```

---

## 6. How `flatten_runs_to_messages` Works

This function converts the MongoDB runs array → flat messages for frontend:

```python
def flatten_runs_to_messages(conv):
    """
    MongoDB stores runs as:
    runs = [
        { "run_id": "r1", "query": "Q1", "answer": "A1", ... },
        { "run_id": "r2", "query": "Q2", "answer": "A2", ... }
    ]
    
    Frontend expects messages as FLAT array:
    messages = [
        { "id": "r1_user", "role": "user", "content": "Q1", ... },
        { "id": "r1_assistant", "role": "assistant", "content": "A1", ... },
        { "id": "r2_user", "role": "user", "content": "Q2", ... },
        { "id": "r2_assistant", "role": "assistant", "content": "A2", ... }
    ]
    """
    messages = []
    # Loop through each run in the runs array
    for run in conv.get("runs", []):
        run_id = run.get("run_id", "")
        
        # Create USER message from the query
        messages.append({
            "id": f"{run_id}_user",        # Unique ID
            "role": "user",                # Marks this as user message
            "content": run.get("query", ""),# The question user typed
            "timestamp": run.get("timestamp", ""),
            "run_id": run_id,               # Links to the run
        })
        
        # Create ASSISTANT message from the answer
        messages.append({
            "id": f"{run_id}_assistant",
            "role": "assistant",
            "content": run.get("answer", ""),
            "timestamp": run.get("timestamp", ""),
            "sources": run.get("sources", []),  # Document sources
            "run_id": run_id,
        })
    
    return messages
```

---

## 7. Complete Example: Sending a Chat Message

### What happens end-to-end:

```python
# ─── FRONTEND (App.tsx) ──────────────────────────────────────────
# User clicks Send with query "What is attention?"

const handleSendMessage = async (content) => {
  // 1. Show user message immediately
  setMessages(prev => [...prev, { role: "user", content }]);
  
  // 2. Call API
  const response = await chatApi.sendMessage({
    conversation_id: conversationId,  // Could be undefined (new chat)
    query: content                    // "What is attention?"
  });
  
  // 3. Show AI response
  setMessages(prev => [...prev, {
    role: "assistant",
    content: response.answer,     // The AI's answer
    sources: response.sources,    // Source documents
    run_id: response.run_id       // Links to this specific exchange
  }]);
};

# ─── BACKEND (server.py) ─────────────────────────────────────────

@app.post("/api/chat")
async def chat(request: ChatRequest):
    # request.conversation_id = None (first message of new chat)
    # request.query = "What is attention?"
    
    # 1. Search documents using RAG
    answer = rag_search.search_and_summarize(request.query, top_k=5)
    # Returns: "Attention is a mechanism that allows models to focus..."
    
    # 2. Get source documents
    results = rag_search.vectorstore.query(request.query, top_k=5)
    sources = [...]
    # sources = [Source(document_name="paper.pdf", page=5), ...]
    
    # 3. Check if conversation exists
    conv = ConversationModel.get(conversation_id)  
    # Returns None (new conversation)
    
    # 4. Create new conversation
    if not conv:
        title = "What is attention?"  # First 50 chars
        conversation_id = ConversationModel.create(title)  # Returns the actual stored _id
    
    # 5. Save this Q&A pair to MongoDB
    ConversationModel.add_run(
        conversation_id=conversation_id,
        run_id=run_id,            # New UUID for this exchange
        query=request.query,      # "What is attention?"
        answer=answer,            # AI's response
        sources=sources_dict      # Source documents
    )
    
    # 6. Return response
    return ChatResponse(
        conversation_id=conversation_id,
        run_id=run_id,
        answer=answer,
        sources=sources
    )

# ─── MONGODB (database.py) ────────────────────────────────────────
# add_run() does:
# conversations_collection.update_one(
#     {"_id": "new-conv-id"},
#     {"$push": {"runs": {
#         "run_id": "run-uuid",
#         "query": "What is attention?",
#         "answer": "Attention is a mechanism...",
#         "sources": [{"document_name": "paper.pdf", "page": 5}],
#         "timestamp": "2026-06-06T12:00:00"
#     }}}
# )
```

---

## Quick Reference Card

| Method | Endpoint | What it does | Body | URL Params |
|--------|----------|-------------|------|------------|
| `POST` | `/api/chat` | Send a message → get AI answer | `{ query, conversation_id? }` | — |
| `GET` | `/api/conversations` | List all conversations | — | `?include_archived=true` |
| `GET` | `/api/conversations/{id}` | Get one conversation with all runs | — | — |
| `POST` | `/api/conversations` | Create new empty conversation | `{ title }` | — |
| `PUT` | `/api/conversations/{id}` | Rename or archive a conversation | `{ title? }` or `{ is_archived? }` | — |
| `DELETE` | `/api/conversations/{id}` | Delete a conversation entirely | — | — |

### MongoDB Cheat Sheet

| Operation | MongoDB Command | SQL Equivalent |
|-----------|----------------|----------------|
| Create | `insert_one({...})` | `INSERT INTO ... VALUES (...)` |
| Read one | `find_one({"_id": id})` | `SELECT * FROM ... WHERE id = ?` |
| Read all | `find({"is_archived": False})` | `SELECT * FROM ... WHERE is_archived = 0` |
| Update | `update_one({"_id": id}, {"$set": {...}})` | `UPDATE ... SET ... WHERE id = ?` |
| Add to array | `update_one({"_id": id}, {"$push": {"runs": entry}})` | Requires separate table |
| Delete | `delete_one({"_id": id})` | `DELETE FROM ... WHERE id = ?` |