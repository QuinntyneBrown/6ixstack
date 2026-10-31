import { BreakpointObserver } from '@angular/cdk/layout';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { mediaUp, sheetDialogConfig } from 'components';
import { filter } from 'rxjs';
import { MOBILE_MENU_TITLE_ID, MobileMenuDialog } from '../dialogs/mobile-menu/mobile-menu-dialog';

/**
 * Opens the phone menu from the header's menu button, and closes it on navigation and when the viewport
 * reaches the large breakpoint, so it never stays open beside the header navigation (app-shell design).
 */
@Injectable({ providedIn: 'root' })
export class MenuController {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private ref: DialogRef<unknown, MobileMenuDialog> | null = null;

  readonly isOpen = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(() => this.close());
    inject(BreakpointObserver)
      .observe(mediaUp('lg'))
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((state) => {
        if (state.matches) {
          this.close();
        }
      });
  }

  open(trigger: HTMLElement): void {
    if (this.ref) {
      return;
    }
    this.ref = this.dialog.open(
      MobileMenuDialog,
      sheetDialogConfig(this.overlay, { ariaLabelledBy: MOBILE_MENU_TITLE_ID, restoreFocus: trigger }),
    );
    this.isOpen.set(true);
    this.ref.closed.subscribe(() => {
      this.ref = null;
      this.isOpen.set(false);
    });
  }

  close(): void {
    this.ref?.close();
  }
}
