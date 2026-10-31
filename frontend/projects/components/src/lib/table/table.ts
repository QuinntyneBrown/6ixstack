import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * A scrollable, bordered data table (design system: table). Project a plain `<table class="table">`; header cells
 * with `aria-sort` hold a button that the page uses to change the sort, and `.num` cells align right.
 */
@Component({
  selector: 'sx-table',
  template: '<ng-content />',
  styleUrl: './table.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Table {}
