import { Dialog } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, output } from '@angular/core';
import { modalDialogConfig } from 'components';
import {
  KEYBOARD_SHORTCUTS_TITLE_ID,
  KeyboardShortcutsDialog,
} from '../../dialogs/keyboard-shortcuts/keyboard-shortcuts-dialog';

/**
 * Review queue shortcuts (L2-064): J and K move between cards, A approves the focused card and ? lists the
 * shortcuts. R arrives with reject. Keys are ignored while typing, with a modifier held, or while a dialog is open.
 */
@Directive({
  selector: '[sxReviewQueueShortcuts]',
  host: { '(document:keydown)': 'onKey($event)' },
})
export class ReviewQueueShortcuts {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(Dialog);
  private readonly document = inject(DOCUMENT);

  /** The focused card's element, when A is pressed on it. */
  readonly approveRequested = output<HTMLElement>();

  protected onKey(event: KeyboardEvent): void {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      this.dialog.openDialogs.length ||
      isTyping(event.target)
    ) {
      return;
    }

    if (event.key === 'j' || event.key === 'J') {
      this.move(1);
    } else if (event.key === 'k' || event.key === 'K') {
      this.move(-1);
    } else if (event.key === 'a' || event.key === 'A') {
      const card = this.focusedCard();
      if (!card) return;
      this.approveRequested.emit(card);
    } else if (event.key === '?') {
      this.dialog.open(
        KeyboardShortcutsDialog,
        modalDialogConfig({ ariaLabelledBy: KEYBOARD_SHORTCUTS_TITLE_ID, restoreFocus: true }),
      );
    } else {
      return;
    }
    event.preventDefault();
  }

  private focusedCard(): HTMLElement | null {
    const active = this.document.activeElement;
    return active instanceof HTMLElement ? active.closest<HTMLElement>('.review-card') : null;
  }

  private move(step: number): void {
    const cards = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.review-card'));
    if (!cards.length) return;
    const current = cards.findIndex((card) => card.contains(this.document.activeElement));
    const next = current === -1 ? 0 : Math.min(cards.length - 1, Math.max(0, current + step));
    cards[next].focus();
    cards[next].scrollIntoView({ block: 'nearest' });
  }
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}
