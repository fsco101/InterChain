# Development Guidelines

## Code Quality Standards

### Python Formatting (Backend)
- Use 4-space indentation for Python code
- Follow PEP 8 style guide conventions
- Maintain blank lines between function definitions
- Use descriptive variable names (e.g., `collection_name`, `user_query`, `payload`)
- Group related functions logically within modules
- Format imports: standard library, third-party, local application imports (separated by blank lines)

### JavaScript/JSX Formatting (Frontend)
- Use 2-space indentation for JavaScript/JSX/CSS
- Prefer single quotes for strings in JavaScript
- Use template literals for string interpolation
- Maintain consistent spacing in JSX attributes
- Place closing brackets on new lines for multi-line JSX
- Use camelCase for variables and functions, PascalCase for components

### Code Documentation
- Add inline comments sparingly, only for complex logic
- Use docstrings for Python functions with multiple parameters
- Document parameters and return types where helpful
- Prefer self-documenting code with clear naming

## Architectural Patterns

### Backend Structure
- **Router → Service → Database**: Strict separation of concerns
  - Routers handle HTTP requests, validation, and responses
  - Services contain business logic and orchestrate operations
  - Database layer manages persistence operations
- **Dependency Injection**: Use FastAPI's `Depends()` for authentication and database access
  ```python
  async def endpoint(current_user: dict = Depends(require_roles("student"))):
  ```
- **Async/Await**: All database operations use async patterns with Motor
  ```python
  async def create_record(...):
      result = await db.collection.insert_one(document)
  ```

### Frontend Structure
- **Component-Based Architecture**: Break UI into reusable components
- **Protected Routes**: Wrap pages with `ProtectedRoute` component for role-based access
  ```jsx
  <ProtectedRoute allowedRoles={['employer']}>
    <DashboardShell links={LINKS}>
      <Component />
    </DashboardShell>
  </ProtectedRoute>
  ```
- **Context for Global State**: Use React Context (AuthContext) for user authentication
- **Zustand for Local State**: Supplement with Zustand for more complex state management needs

### Database Patterns
- **Fallback Mechanism**: Implement JSON file storage when MongoDB unavailable
  - Maintains same API interface as MongoDB
  - Automatically serializes/deserializes ObjectId and datetime
  - Persists after each write operation
- **Embedded Documents**: Store blockchain metadata within records, not separate collections
  ```python
  "blockchain": {
      "tx_hash": "...",
      "explorer_url": "...",
      "network": "...",
      "recorded_at": "...",
      "status": "...",
      "enabled": true
  }
  ```
- **Collection Naming**: Use lowercase with underscores (e.g., `activity_logs`, `student_reports`)

## API Design Standards

### Endpoint Naming
- Use plural nouns: `/records`, `/users`, `/notifications`
- Group by role: `/records/student`, `/records/instructor`, `/records/employer`
- Use verbs for actions: `/search`, `/bulk-delete`
- RESTful conventions: GET (read), POST (create), DELETE (delete)

### Request/Response Patterns
- Accept Pydantic models for request bodies:
  ```python
  async def create_activity(payload: StudentActivityCreate, ...):
  ```
- Return dictionaries with consistent structure:
  ```python
  return {"activity_logs": data, "reports": data}
  return {"deleted": count}
  ```
- Use HTTP status codes implicitly (FastAPI defaults)

### Authentication Flow
- JWT tokens passed in headers
- Role validation via `require_roles()` dependency
- Extract user info from token: `current_user["id"]`, `current_user["role"]`

## Common Idioms

### Python/Backend
- **Query Matching**: Custom `_matches()` function for MongoDB-like queries in fallback
  ```python
  if _matches(document, query):
      # document matches query
  ```
- **Async Iteration**:
  ```python
  async for doc in cursor:
      results.append(doc)
  ```
- **Aggregation Pipelines**:
  ```python
  pipeline = [
      {"$group": {"_id": "$payload.internship_id"}},
      {"$limit": 10}
  ]
  async for doc in db[col].aggregate(pipeline):
  ```
- **Model Serialization**: `payload.model_dump(mode="json")` for Pydantic to dict

### JavaScript/Frontend
- **State Updates with Spread**:
  ```javascript
  setForm((prev) => ({ ...prev, [key]: value }))
  ```
- **Optional Chaining**: `user?.institution`, `file?.trim()`
- **Conditional Rendering**:
  ```jsx
  {condition && <Component />}
  {condition ? <A /> : <B />}
  ```
- **Array Mapping**:
  ```jsx
  {items.map((item) => <ItemRow key={item.id} item={item} />)}
  ```
- **Async/Await in Event Handlers**:
  ```javascript
  const handleSubmit = async () => {
      const { data } = await apiCall()
      setState(data)
  }
  ```

## Data Validation

### Backend Validation
- Use Pydantic models for all request bodies
- Define schemas in `app/schemas/` directory
- Leverage Pydantic's built-in type checking and validation
  ```python
  class StudentActivityCreate(BaseModel):
      internship_id: str
      activity_date: str
      title: str
      description: str
      hours_spent: int
  ```

### Frontend Validation
- Client-side validation before API calls
- Check required fields manually before submission
  ```javascript
  const required = ['field1', 'field2']
  for (const k of required) {
      if (!form[k]?.trim()) {
          showError('Missing field', `"${k}" is required`)
          return
      }
  }
  ```
- Use confirmation dialogs for destructive actions: `confirmAction()`

## Error Handling

### Backend Patterns
- Let FastAPI handle most HTTP exceptions automatically
- Catch database errors silently in non-critical paths
- Return boolean flags or counts for operation status
  ```python
  return {"deleted": ok}
  ```

### Frontend Patterns
- Use utility functions from `utils/alerts.js`:
  - `showError(title, message)` for error notifications
  - `showSuccess(title, message)` for success notifications
  - `extractError(err)` to parse error responses
  - `confirmAction(options)` for user confirmations
- Try-catch blocks for all API calls:
  ```javascript
  try {
      const { data } = await apiCall()
      showSuccess('Success', 'Operation completed')
  } catch (err) {
      showError('Error', extractError(err))
  }
  ```

## Frequently Used Annotations

### Python Type Hints
- Function parameters: `def func(param: str, count: int = 0)`
- Return types: `async def get_data() -> dict | None:`
- Collections: `list[dict]`, `dict[str, list[dict]]`
- Optional types: `dict | None`, `str | None`
- Import from typing: `from collections.abc import AsyncIterator`

### FastAPI Decorators
- Route definitions: `@router.get("/path")`, `@router.post("/path")`, `@router.delete("/path/{id}")`
- Dependency injection: `Depends(require_roles("student", "instructor"))`
- Query parameters: `q: str = ""`

### React Hooks
- `useState`: Local component state
- `useEffect`: Side effects and lifecycle
- `useRef`: DOM references and persistent values
- `useAuth`: Custom hook for authentication context

## File Organization Principles

### Backend
- **Routers**: One file per resource domain (records.py, users.py, etc.)
- **Services**: Business logic separated from HTTP handlers
- **Schemas**: Pydantic models for request/response validation
- **Database**: Connection logic and fallback implementations in `db/`
- **Utils**: Helper functions and utilities

### Frontend
- **Pages**: Full page components in `pages/` by role (student/, instructor/, employer/)
- **Components**: Reusable UI elements in `components/`
- **API**: HTTP client functions grouped by endpoint in `api/`
- **Context**: Global state providers in `context/`
- **Data**: Static data like school lists in `data/`
- **Utils**: Helper functions for alerts, formatting, etc.

## Performance Considerations

- Use `.limit()` on database queries to prevent large result sets
- Lazy load data only when needed (separate endpoints for overview vs. history)
- Scale images appropriately before rendering (certificate preview uses transform scale)
- Debounce search inputs to reduce API calls
- Use `async`/`await` consistently to avoid blocking operations

## Security Practices

- Hash passwords with bcrypt before storage
- Store JWT secrets in environment variables
- Validate user roles on every protected endpoint
- Use CORS configuration appropriately
- Sanitize user inputs through Pydantic validation
- Never expose sensitive data in API responses
- Use HTTPS in production for token transmission
