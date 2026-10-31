import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

/** Saves a Blob under a file name through a temporary object URL and a `download` link. */
@Injectable({ providedIn: 'root' })
export class FileDownloader {
  private readonly document = inject(DOCUMENT);

  save(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    this.document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
}
