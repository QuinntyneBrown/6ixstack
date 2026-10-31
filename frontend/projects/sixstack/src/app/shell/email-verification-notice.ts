import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { ToastService } from 'components';
import { filter } from 'rxjs';

/**
 * The verification link lands on `/?email-verified=1` (or `=0`); this shows the outcome as a toast and drops the
 * parameter from the address (submissions/submit-event, L2-085).
 */
@Injectable({ providedIn: 'root' })
export class EmailVerificationNotice {
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  watch(destroyRef = inject(DestroyRef)): void {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(() => {
        const tree = this.router.parseUrl(this.router.url);
        const outcome = tree.queryParams['email-verified'];
        if (outcome !== '1' && outcome !== '0') return;
        this.toasts.show(
          outcome === '1'
            ? {
                kind: 'success',
                title: 'Your email is verified',
                text: 'Events a moderator approves now go live straight away.',
              }
            : {
                kind: 'danger',
                title: 'That link didn’t work',
                text: 'It may have expired or been used already. Your next submission sends a new one.',
              },
        );
        tree.queryParams = { ...tree.queryParams };
        delete tree.queryParams['email-verified'];
        void this.router.navigateByUrl(tree, { replaceUrl: true });
      });
  }
}
