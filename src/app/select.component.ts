import { Component, ElementRef, HostListener, inject, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-select',
  standalone: true,
  template: `
    <div class="sel">
      <button type="button" class="sel-btn" aria-haspopup="listbox"
              [attr.aria-expanded]="open()" [class.open]="open()" [class.ph]="!value()"
              (click)="open.set(!open())" (keydown.escape)="open.set(false)">
        <span class="sel-txt">{{ value() || clearLabel() || placeholder() }}</span>
        <svg class="sel-ch" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      @if (open()) {
        <div class="sel-pop" role="listbox" (mousedown)="$event.preventDefault()" (click)="$event.preventDefault()">
          @if (clearLabel()) {
            <div class="sel-opt" role="option" [class.on]="!value()" (click)="pick('')">{{ clearLabel() }}</div>
          }
          @for (o of options(); track o) {
            <div class="sel-opt" role="option" [class.on]="o === value()" (click)="pick(o)">
              <span>{{ o }}</span>
              @if (o === value()) {
                <svg class="sel-ck" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .sel { position: relative; }

    .sel-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: .5rem; text-align: left;
               padding: .6rem .7rem; border: 1.5px solid var(--line); border-radius: 10px; background: #fff; color: var(--ink);
               font: inherit; cursor: pointer; box-shadow: none; filter: none; }
    .sel-btn:hover { filter: none; border-color: #bcd0f5; }
    .sel-btn:focus-visible, .sel-btn.open { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, .18); }
    .sel-btn.ph .sel-txt { color: #8a97ad; font-weight: 400; }
    .sel-txt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .sel-ch { width: 16px; height: 16px; flex: 0 0 16px; fill: none; stroke: #64748b; stroke-width: 2.5;
              stroke-linecap: round; stroke-linejoin: round; transition: transform .15s; }
    .sel-btn.open .sel-ch { transform: rotate(180deg); }

    .sel-pop { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30; max-height: 240px; overflow: auto; padding: 4px;
               background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 14px 36px rgba(29, 78, 216, .18); }
    .sel-opt { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .5rem .7rem; border-radius: 8px;
               font-size: .9rem; font-weight: 500; color: var(--ink); cursor: pointer; }
    .sel-opt:hover { background: #eff5ff; }
    .sel-opt.on { background: #e8f0ff; color: var(--primary-dark); font-weight: 700; }
    .sel-ck { width: 16px; height: 16px; flex: 0 0 16px; fill: none; stroke: currentColor; stroke-width: 3;
              stroke-linecap: round; stroke-linejoin: round; }
  `],
})
export class SelectComponent {
  private host = inject(ElementRef);

  options = input<string[]>([]);
  placeholder = input('Choose');
  clearLabel = input('');
  value = model<string>('');
  open = signal(false);

  pick(o: string) {
    this.value.set(o);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}