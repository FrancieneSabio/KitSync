import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService, Employee } from '../data.service';
import { CATEGORIES } from '../catalog';
import { SelectComponent } from '../select.component';

const blank = (): Employee => ({ empNo: '', name: '', department: '', position: '', uniformSize: '', shoeSize: '' });
const PALETTE = ['#2563eb', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#0ea5e9'];

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [FormsModule, SelectComponent],
  template: `
    <div class="emp">
      <h1>Employees</h1>
      <p class="sub">Keep each person's sizes on file so issuing supplies is quick.</p>

      <div class="tiles">
        <div class="stat-card">
          <div class="chip"><svg class="ic" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div>
            <div class="label">Employees</div>
            <div class="num">{{ data.employees().length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="chip"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></div>
          <div>
            <div class="label">Departments</div>
            <div class="num">{{ departments().length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="chip" style="background:#fef3c7;color:#b45309"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg></div>
          <div>
            <div class="label">Nothing issued yet</div>
            <div class="num">{{ withoutIssue() }}</div>
            @if (withoutIssue() > 0) { <div class="note warn">Haven't received supplies</div> }
          </div>
        </div>
      </div>

      <form class="panel emp-form" [class.editing]="editingId" (ngSubmit)="save()">
        <div class="panel-head">
          <h2>{{ editingId ? 'Edit employee' : 'Add employee' }}</h2>
          @if (editingId) { <span class="badge warn">Editing</span> }
        </div>
        <div class="grid">
          <label>Employee no. <input name="empNo" [(ngModel)]="form.empNo" required placeholder="e.g. 1001"></label>
          <label>Full name <input name="name" [(ngModel)]="form.name" required placeholder="Juan Dela Cruz"></label>

          <label>Department
            <div class="emp-wrap">
              <input name="department" [(ngModel)]="form.department" autocomplete="off" placeholder="e.g. Operations"
                     (focus)="deptOpen = true" (blur)="deptOpen = false" (input)="deptOpen = true">
              @if (deptOpen && filteredDepts().length) {
                <div class="emp-pop">
                  @for (d of filteredDepts(); track d) {
                    <div class="emp-opt" (mousedown)="pickDept(d, $event)">{{ d }}</div>
                  }
                </div>
              }
            </div>
          </label>

          <label>Position <input name="position" [(ngModel)]="form.position" placeholder="Security guard"></label>

          <label>Uniform size
            <app-select [options]="uniformSizes()" [value]="form.uniformSize ?? ''" (valueChange)="form.uniformSize = $event"
                        clearLabel="Not set" placeholder="Choose size" />
          </label>

          <label>Shoe size
            <app-select [options]="shoeSizes()" [value]="form.shoeSize ?? ''" (valueChange)="form.shoeSize = $event"
                        clearLabel="Not set" placeholder="Choose size" />
          </label>
        </div>
        <div class="row">
          <button type="submit">{{ editingId ? 'Save changes' : 'Add employee' }}</button>
          @if (editingId) { <button type="button" class="ghost" (click)="reset()">Cancel</button> }
        </div>
      </form>

      <div class="panel">
        <div class="panel-head">
          <h2>All employees <span class="badge ok" style="margin-left:.4rem">{{ shown().length }}</span></h2>
          <input class="emp-search" placeholder="Search name, number, department" [ngModel]="q()" (ngModelChange)="q.set($event)">
        </div>
        @if (shown().length === 0) {
          <div class="empty">No employees found.<br>Add one using the form above.</div>
        } @else {
          <div class="tablewrap"><table>
            <tr><th>Employee</th><th>Position</th><th>Department</th><th>Uniform</th><th>Shoes</th><th>Received</th><th></th></tr>
            @for (e of shown(); track e.id) {
              <tr [class.emp-editing]="e.id === editingId">
                <td>
                  <div class="who-cell">
                    <span class="mini-av emp-av" [style.background]="color(e.name) + '22'" [style.color]="color(e.name)">{{ initials(e.name) }}</span>
                    <div>
                      <strong>{{ e.name }}</strong>
                      <small class="emp-no">No. {{ e.empNo }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ e.position || '—' }}</td>
                <td>
                  @if (e.department) { <span class="emp-tag">{{ e.department }}</span> } @else { <span class="muted">—</span> }
                </td>
                <td>@if (e.uniformSize) { <span class="emp-size">{{ e.uniformSize }}</span> } @else { <span class="muted">—</span> }</td>
                <td>@if (e.shoeSize) { <span class="emp-size">{{ e.shoeSize }}</span> } @else { <span class="muted">—</span> }</td>
                <td>
                  <span class="badge" [class.ok]="received(e.id!) > 0" [class.warn]="received(e.id!) === 0">
                    {{ received(e.id!) }} {{ received(e.id!) === 1 ? 'item' : 'items' }}
                  </span>
                </td>
                <td>
                  <div class="emp-actions">
                    <button type="button" class="ghost" (click)="edit(e)">Edit</button>
                    <button type="button" class="danger" (click)="remove(e)">Delete</button>
                  </div>
                </td>
              </tr>
            }
          </table></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .emp-form.editing { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, .12); }
    .emp-search { width: 280px; max-width: 100%; }
    .emp-av { width: 36px; height: 36px; flex: 0 0 36px; font-size: 12px; }
    .emp-no { display: block; color: var(--muted); font-size: .78rem; }
    .emp-tag { display: inline-block; padding: .15rem .65rem; border-radius: 999px; font-size: .78rem; font-weight: 700; background: var(--tint); color: var(--primary-dark); }
    .emp-size { display: inline-block; min-width: 2.2rem; text-align: center; padding: .15rem .55rem; border-radius: 8px; font-size: .82rem; font-weight: 700; background: #f1f5f9; color: var(--ink); }
    .emp-actions { display: flex; gap: .4rem; }
    .emp-actions button { padding: .35rem .85rem; font-size: .85rem; }
    tr.emp-editing td { background: var(--tint); }

    .emp-wrap { position: relative; }
    .emp-wrap input { width: 100%; }
    .emp-pop { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30; max-height: 240px; overflow: auto; padding: 4px;
               background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 14px 36px rgba(29, 78, 216, .18); }
    .emp-opt { padding: .5rem .7rem; border-radius: 8px; font-size: .9rem; font-weight: 500; color: var(--ink); cursor: pointer; }
    .emp-opt:hover { background: var(--tint); }
  `],
})
export class EmployeesComponent {
  data = inject(DataService);
  form: Employee = blank();
  editingId: string | null = null;
  q = signal('');
  deptOpen = false;

  constructor() {
    inject(ActivatedRoute).queryParamMap.subscribe(p => this.q.set(p.get('q') ?? ''));
  }

  shown = computed(() => {
    const s = this.q().trim().toLowerCase();
    return this.data.employees()
      .filter(e => `${e.name} ${e.empNo} ${e.department ?? ''} ${e.position ?? ''}`.toLowerCase().includes(s))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  departments = computed(() => {
    const set = new Set(this.data.employees().map(e => (e.department ?? '').trim()).filter(Boolean));
    return [...set].sort();
  });

  withoutIssue = computed(() => {
    const ids = new Set(this.data.distributions().map(d => d.employeeId));
    return this.data.employees().filter(e => !ids.has(e.id!)).length;
  });

  filteredDepts() {
    const s = (this.form.department ?? '').trim().toLowerCase();
    return this.departments().filter(d => d.toLowerCase().includes(s) && d.toLowerCase() !== s);
  }

  pickDept(d: string, e: Event) {
    e.preventDefault();
    this.form.department = d;
    this.deptOpen = false;
  }

  uniformSizes() { return this.withCurrent(CATEGORIES.find(c => c.name === 'Uniform')?.sizes ?? [], this.form.uniformSize); }
  shoeSizes() { return this.withCurrent(CATEGORIES.find(c => c.name === 'Shoes')?.sizes ?? [], this.form.shoeSize); }

  private withCurrent(list: string[], current?: string) {
    return current && !list.includes(current) ? [current, ...list] : list;
  }

  received(id: string) {
    return this.data.distributions().filter(d => d.employeeId === id).length;
  }

  initials(name?: string) {
    return (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  }

  color(name: string) {
    let h = 0;
    for (const ch of name ?? '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }

  async save() {
    const { id, ...rest } = this.form as Employee & { created_at?: string };
    delete (rest as any).created_at;
    const emp = { ...rest, empNo: rest.empNo.trim(), name: rest.name.trim() };
    try {
      if (this.editingId) await this.data.updateEmployee(this.editingId, emp);
      else await this.data.addEmployee(emp);
      this.reset();
    } catch (err: any) {
      alert('Could not save: ' + (err?.message ?? err));
    }
  }

  edit(e: Employee) {
    this.form = { ...e };
    this.editingId = e.id!;
    window.scrollTo({ top: 0 });
  }

  reset() {
    this.form = blank();
    this.editingId = null;
  }

  async remove(e: Employee) {
    if (confirm(`Delete ${e.name}? Their distribution records are kept.`)) {
      try {
        await this.data.deleteEmployee(e.id!);
      } catch (err: any) {
        alert('Could not delete: ' + (err?.message ?? err));
      }
    }
  }
}