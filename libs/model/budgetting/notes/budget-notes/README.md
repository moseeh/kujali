# Budget Notes - CQRS Command Library

This library implements the CQRS command pattern for adding notes to budgets in the Kujali financial management application.

## Overview

**Purpose:** Encapsulates the command and handler logic for the "Add Note to Budget" feature.

**Pattern:** Command Query Responsibility Segregation (CQRS)

**Architecture:** Domain-Driven Design with command encapsulation

## Structure

```
src/
├── lib/
│   └── domain/
│       ├── add-note.command.ts    # Command class + Result interface
│       └── add-note.handler.ts    # Handler implementation + ICommandHandler interface
└── index.ts                        # Public API exports
```

## Components

### AddNoteToBudgetCommand (Class)

Encapsulates the data required to add a note to a budget.

```typescript
const command = new AddNoteToBudgetCommand(
  'org-123',           // Organization ID
  'budget-456',        // Budget ID
  { note: 'My note' }  // Note content
);
```

**Properties:**
- `orgId: string` - Organization identifier (multi-tenant isolation)
- `budgetId: string` - Budget identifier (parent entity)
- `note: Notes` - Note content and metadata

### AddNoteToBudgetResult (Interface)

Defines the response structure after successfully adding a note.

```typescript
{
  note: Notes,         // Created note with generated ID
  success: boolean,    // Operation success status
  message?: string     // Optional user-friendly message
}
```

### AddNoteToBudgetHandler (Class)

Implements the business logic to execute the add note command.

**Responsibilities:**
1. Validate note content (non-empty check)
2. Verify budget exists
3. Create note in Firestore subcollection
4. Return success result

**Repository Paths:**
- Budgets: `orgs/${orgId}/budgets`
- Notes: `orgs/${orgId}/budgets/${budgetId}/notes`

### ICommandHandler<TCommand> (Interface)

Generic interface defining the contract for all command handlers in the CQRS pattern.

## Usage

### Import

```typescript
import {
  AddNoteToBudgetCommand,
  AddNoteToBudgetResult,
  AddNoteToBudgetHandler,
  ICommandHandler
} from '@app/model/budgetting/notes/budget-notes';
```

### Create Command

```typescript
const command = new AddNoteToBudgetCommand(
  'org-abc123',
  'budget-xyz789',
  { note: 'Q4 review completed' }
);
```

### Execute Handler

```typescript
const handler = new AddNoteToBudgetHandler();
const result = await handler.execute(command, context, tools);

console.log(result.note.id);      // Auto-generated ID
console.log(result.success);      // true
console.log(result.message);      // "Note successfully added to budget..."
```

## Design Decisions

### Why Class for Command?

Following the assessment requirement to use a **class** instead of interface:
- ✅ Encapsulates data with proper OOP structure
- ✅ Allows for constructor validation (extensible)
- ✅ Runtime existence (can use `instanceof`)
- ⚠️ Note: Existing codebase uses interfaces for commands

### Why Separate Command and Handler?

**CQRS Pattern Separation:**
- **Command** = Data contract (what to execute)
- **Handler** = Business logic (how to execute)
- Enables independent testing and evolution

### Multi-Tenant Design

Every command includes `orgId` for data isolation:
- Firestore paths: `orgs/${orgId}/...`
- Matches existing architecture (all 18 handlers use this pattern)
- Security: Prevents cross-organization data access

### Hierarchical Data Structure

Notes are stored as subcollections under budgets:
```
orgs/{orgId}/budgets/{budgetId}/notes/{noteId}
```

**Benefits:**
- Natural parent-child relationship
- Automatic cleanup (delete budget → delete notes)
- Firestore best practice for hierarchical data

## Dependencies

- `@iote/cqrs` - CQRS foundation (HandlerTools, Repository)
- `@ngfi/functions` - Firebase Functions integration (FunctionHandler)
- `@app/model/finance/notes` - Notes entity model
- `@app/model/finance/planning/budgets` - Budget entity model

## Testing

```bash
# Run unit tests
nx test model-budgetting-notes-budget-notes

# Run linter
nx lint model-budgetting-notes-budget-notes
```

## Deployment

This library is used by Firebase Cloud Functions. To deploy:

1. Create function wrapper in `apps/kujali-functions/src/app/`
2. Export handler from library
3. Register function in `apps/kujali-functions/src/main.ts`
4. Deploy: `firebase deploy --only functions`

---

**Generated with:** Nx 15.4.4
**Pattern:** CQRS + Domain-Driven Design
**Library Type:** Node.js TypeScript library
