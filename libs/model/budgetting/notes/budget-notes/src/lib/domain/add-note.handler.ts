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