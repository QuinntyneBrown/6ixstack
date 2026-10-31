import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DescriptionSegment = { text: string } | { href: string; label: string };
export type DescriptionBlock =
  { kind: 'paragraph'; lines: DescriptionSegment[][] } | { kind: 'list'; items: DescriptionSegment[][] };

const LINK = /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;

/** Splits text into plain segments and `[label](https://…)` links; any other Markdown stays literal (L2-081). */
export function parseInline(text: string): DescriptionSegment[] {
  const segments: DescriptionSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index) });
    segments.push({ label: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

/** Paragraphs separated by blank lines; a block whose lines all start with "- " is a bullet list. */
export function parseDescription(text: string): DescriptionBlock[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').filter((line) => line.trim().length > 0))
    .filter((lines) => lines.length > 0)
    .map((lines) =>
      lines.every((line) => /^\s*-\s+/.test(line))
        ? { kind: 'list' as const, items: lines.map((line) => parseInline(line.replace(/^\s*-\s+/, ''))) }
        : { kind: 'paragraph' as const, lines: lines.map(parseInline) },
    );
}

/**
 * Renders an organizer's description safely: paragraphs, line breaks, bullet lists and `https` links only, each
 * link with `rel="noopener noreferrer nofollow"`. Everything is interpolated as text, never as HTML.
 */
@Component({
  selector: 'sx-description',
  template: `
    @for (block of blocks(); track $index) {
      @if (block.kind === 'list') {
        <ul>
          @for (item of block.items; track $index) {
            <li>
              <ng-container *ngTemplateOutlet="segments; context: { $implicit: item }" />
            </li>
          }
        </ul>
      } @else {
        <p>
          @for (line of block.lines; track $index; let last = $last) {
            <ng-container *ngTemplateOutlet="segments; context: { $implicit: line }" />
            @if (!last) {
              <br />
            }
          }
        </p>
      }
    }
    <ng-template #segments let-parts>
      @for (part of parts; track $index) {
        @if (part.href) {
          <a [href]="part.href" target="_blank" rel="noopener noreferrer nofollow">{{ part.label }}</a>
        } @else {
          {{ part.text }}
        }
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacingHorizontalL);
    }
    ul {
      padding-left: var(--spacingHorizontalXL);
      display: flex;
      flex-direction: column;
      gap: var(--spacingHorizontalS);
      margin: 0;
    }
  `,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Description {
  readonly text = input.required<string>();
  protected readonly blocks = computed(() => parseDescription(this.text()));
}
