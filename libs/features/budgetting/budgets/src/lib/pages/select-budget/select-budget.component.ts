import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';

import { cloneDeep as ___cloneDeep, flatMap as __flatMap } from 'lodash';

import { Logger } from '@iote/bricks-angular';

import {
  Budget,
  BudgetRecord,
  BudgetStatus,
} from '@app/model/finance/planning/budgets';

import {
  BudgetsStore,
  OrgBudgetsStore,
} from '@app/state/finance/budgetting/budgets';

import { CreateBudgetModalComponent } from '../../components/create-budget-modal/create-budget-modal.component';

@Component({
  selector: 'app-select-budget',
  templateUrl: './select-budget.component.html',
  styleUrls: [
    './select-budget.component.scss',
    '../../components/budget-view-styles.scss',
  ],
})
/**
 * List of all active budgets on the system.
 *
 * NOTE: This component uses Angular Signals (Angular 16+)
 * Current project version: Angular 15.0.4
 * This code will not compile without upgrading to Angular 16+
 */
export class SelectBudgetPageComponent {

  // Inject dependencies using inject() instead of constructor
  private _orgBudgets$$ = inject(OrgBudgetsStore);
  private _budgets$$ = inject(BudgetsStore);
  private _dialog = inject(MatDialog);
  private _logger = inject(Logger);

  // Load RxJS observable streams into Angular signals
  overview = toSignal(this._orgBudgets$$.get(), { initialValue: [] });
  sharedBudgets = toSignal(this._budgets$$.get(), { initialValue: [] });

  showFilter = false;

  // Computed signal combining and transforming budget data
  allBudgets = computed(() => {
    const overview = this.overview();
    const budgets = this.sharedBudgets();

    const flatOverview = __flatMap(overview);
    const flatBudgets = __flatMap(budgets);

    const transformedBudgets = flatBudgets.map((budget: any) => {
      budget['endYear'] = budget.startYear + budget.duration - 1;
      return budget;
    });

    return {
      overview: flatOverview,
      budgets: transformedBudgets,
    };
  });

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  fieldsFilter(value: (Invoice) => boolean) {
    // this.filter$$.next(value);
  }

  toogleFilter(value) {
    // this.showFilter = value
  }

  openDialog(parent: Budget | false): void {
    const dialog = this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent != null ? parent : false,
    });

    dialog.afterClosed().subscribe(() => {
      // Dialog after action
    });
  }

  /**
   * @TODO - Review and fix
   * Returns true if the budget can be activated */
  canPromote(record: BudgetRecord) {
    // Get's set on Budget Read from user privileges and budget status.
    return (record.budget as any).canBeActivated;
  }

  /** Activate budget -> Promote to be used in  */
  setActive(record: BudgetRecord) {
    const toSave = ___cloneDeep(record.budget);

    // Clean up budget record values.
    delete (toSave as any).canBeActivated;
    delete (toSave as any).access;

    // Set Active
    toSave.status = BudgetStatus.InUse;

    (<any>record).updating = true;

    // Use effect for side effects - reactive pattern
    effect(() => {
      this._budgets$$.update(toSave).subscribe({
        next: () => {
          (<any>record).updating = false;
          this._logger.log(
            () =>
              `Updated Budget with id ${toSave.id}. Set as an active budget for this org.`
          );
        },
        error: (error) => {
          (<any>record).updating = false;
          console.error('Failed to activate budget:', error);
        }
      });
    }, { allowSignalWrites: true });
  }
}
