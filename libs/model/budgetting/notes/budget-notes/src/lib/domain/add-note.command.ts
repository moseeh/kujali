import { Notes } from '@app/model/finance/notes';

/**
 * Command to add a note to a budget.
 *
 * This command encapsulates all the data needed to create a note
 * and associate it with a specific budget in an organization.
 */
export class AddNoteToBudgetCommand {
  /**
   * @param orgId - Organization ID for multi-tenant data isolation
   * @param budgetId - Budget ID to which the note will be added
   * @param note - The note content and metadata
   */
  constructor(
    public readonly orgId: string,
    public readonly budgetId: string,
    public readonly note: Notes
  ) {}
}
