import { HandlerTools } from '@iote/cqrs';
import { FunctionHandler, FunctionContext } from '@ngfi/functions';

import { Notes } from '@app/model/finance/notes';
import { Budget } from '@app/model/finance/planning/budgets';

import { AddNoteToBudgetCommand, AddNoteToBudgetResult } from './add-note.command';

/**
 * Generic Command Handler Interface
 *
 * Defines the contract for all command handlers in the CQRS pattern.
 * Command handlers are responsible for processing write operations.
 *
 * @template TCommand - The command type to be executed
 */
export interface ICommandHandler<TCommand> {
  /**
   * Executes the command
   *
   * @param command - The command data to process
   * @returns Promise that resolves when command is executed
   */
  execute(command: TCommand): Promise<void>;
}

// Repository path constants following multi-tenant pattern
const BUDGETS_REPO = (orgId: string) => `orgs/${orgId}/budgets`;
const BUDGET_NOTES_REPO = (orgId: string, budgetId: string) =>
  `orgs/${orgId}/budgets/${budgetId}/notes`;

/**
 * Handler for adding notes to budgets
 *
 * This handler implements the CQRS command pattern to add notes to budgets.
 * It validates the command data and persists the note to Firestore.
 *
 * Flow:
 * 1. Validate command data (check for empty note content)
 * 2. Verify budget exists
 * 3. Create note in budget's notes subcollection
 * 4. Return success result with created note
 *
 * @extends FunctionHandler<AddNoteToBudgetCommand, AddNoteToBudgetResult>
 */
export class AddNoteToBudgetHandler extends FunctionHandler<AddNoteToBudgetCommand, AddNoteToBudgetResult> {

  /**
   * Execute the add note command
   *
   * @param data - Command data containing orgId, budgetId, and note
   * @param context - Firebase function execution context (auth, etc.)
   * @param tools - Handler utilities (logger, repository access, etc.)
   * @returns Promise resolving to AddNoteToBudgetResult
   */
  public async execute(
    data: AddNoteToBudgetCommand,
    context: FunctionContext,
    tools: HandlerTools
  ): Promise<AddNoteToBudgetResult> {

    // Step 1: Log command execution start
    tools.Logger.log(() =>
      `[AddNoteToBudgetHandler].execute: Adding note to budget ${data.budgetId} in org ${data.orgId}`
    );

    // Step 2: Validate command data
    if (!data.note || !data.note.note || data.note.note.trim() === '') {
      tools.Logger.log(() =>
        `[AddNoteToBudgetHandler].execute: Validation failed - note content is empty`
      );

      throw new Error('Note content cannot be empty');
    }

    tools.Logger.log(() =>
      `[AddNoteToBudgetHandler].execute: Validation passed - note content length: ${data.note.note.length}`
    );

    // Step 3: Verify budget exists
    tools.Logger.log(() =>
      `[AddNoteToBudgetHandler].execute: Verifying budget exists`
    );

    const budgetRepo = tools.getRepository<Budget>(BUDGETS_REPO(data.orgId));
    const budget = await budgetRepo.getDocumentById(data.budgetId);

    if (!budget) {
      tools.Logger.log(() =>
        `[AddNoteToBudgetHandler].execute: Budget ${data.budgetId} not found`
      );

      throw new Error(`Budget with ID ${data.budgetId} not found`);
    }

    tools.Logger.log(() =>
      `[AddNoteToBudgetHandler].execute: Budget found - ${budget.name || data.budgetId}`
    );

    // Step 4: Get notes repository for this budget
    const notesRepo = tools.getRepository<Notes>(
      BUDGET_NOTES_REPO(data.orgId, data.budgetId)
    );

    // Step 5: Create the note
    tools.Logger.log(() =>
      `[AddNoteToBudgetHandler].execute: Creating note in repository`
    );

    const createdNote = await notesRepo.create(data.note);

    tools.Logger.log(() =>
      `[AddNoteToBudgetHandler].execute: Note created successfully with ID: ${createdNote.id}`
    );

    // Step 6: Return success result
    return {
      note: createdNote,
      success: true,
      message: `Note successfully added to budget ${budget.name || data.budgetId}`
    };
  }
}
