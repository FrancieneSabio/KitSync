import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { COMPANY } from '../catalog';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="ct-wrap">
      <header class="ct-brand">
        @if (!logoFailed) {
          <img class="ct-logo" src="logo.png" alt="KitSync" (error)="logoFailed = true">
        } @else {
          <strong class="ct-name">{{ company.short }}</strong>
        }
        <span class="ct-sys">Supply Monitoring System</span>
      </header>

      <div class="ct-card">
        <h1>Create account</h1>
        <p class="ct-sub">Set up your organization and start managing supplies.</p>

        <form (ngSubmit)="submit()">
          <label>
            <span>Organization / Company</span>
            <input type="text" name="organization" [(ngModel)]="organization" required
                   autocomplete="organization" placeholder="e.g. Your company name">
          </label>

          <label>
            <span>Email</span>
            <input type="email" name="email" [(ngModel)]="email" required
                   autocomplete="email" placeholder="name@company.com">
          </label>

          <label>
            <span>Password</span>
            <input type="password" name="password" [(ngModel)]="password" required
                   autocomplete="new-password" placeholder="At least 6 characters">
          </label>

          <label>
            <span>Confirm password</span>
            <input type="password" name="confirm" [(ngModel)]="confirm" required
                   autocomplete="new-password" placeholder="Re-enter password">
          </label>

          @if (error) { <div class="ct-err">{{ error }}</div> }
          @if (success) { <div class="ct-ok">{{ success }}</div> }

          <button type="submit" class="ct-go" [disabled]="busy">
            {{ busy ? 'Creating account…' : 'Register' }}
          </button>
        </form>

        <p class="ct-alt">Already have an account? <a routerLink="/login">Log in</a></p>
      </div>

      <p class="ct-tag">{{ company.tagline }}</p>
      <small class="ct-foot">© {{ company.short }}</small>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; position: relative; overflow: hidden;
            background: linear-gradient(160deg, #eaf1fd 0%, #dce8fb 55%, #cddcf7 100%); }
    :host::before, :host::after { content: ''; position: absolute; border-radius: 50%; pointer-events: none;
            background: rgba(108,144,217,.16); }
    :host::before { width: 420px; height: 420px; left: -140px; top: -140px; }
    :host::after  { width: 340px; height: 340px; right: -110px; bottom: -110px; }

    .ct-wrap { position: relative; z-index: 1; min-height: 100vh; box-sizing: border-box;
               display: flex; flex-direction: column; align-items: center; justify-content: center;
               text-align: center; padding: 32px 20px; }

    .ct-brand { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 22px; }
    .ct-logo { display: block; height: 110px; width: auto; max-width: 260px; object-fit: contain; }
    .ct-name { font-size: 34px; font-weight: 800; letter-spacing: -.02em; color: var(--primary-dark, #4d71bd); }
    .ct-sys { font-size: 13px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted, #8892a8); }

    .ct-card { width: 100%; max-width: 420px; box-sizing: border-box; text-align: left; background: #fff;
               border-radius: 22px; padding: 36px 32px; box-shadow: 0 20px 50px rgba(70,90,140,.15); }
    .ct-card h1 { margin: 0; text-align: center; font-size: 26px; color: var(--ink, #27344f); }
    .ct-sub { margin: 6px 0 24px; text-align: center; color: var(--muted, #8892a8); font-size: 14.5px; }

    form { display: grid; gap: 16px; }
    label span { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #3e4c68; }
    input { width: 100%; box-sizing: border-box; height: 46px; padding: 0 14px; border-radius: 12px;
            border: 1.5px solid #e6ebf5; background: #f6f8fc; font-size: 15px; color: var(--ink, #27344f);
            outline: none; transition: border-color .15s, box-shadow .15s, background .15s; }
    input:focus { background: #fff; border-color: var(--primary, #6c90d9); box-shadow: 0 0 0 4px rgba(108,144,217,.18); }

    .ct-err { padding: 10px 12px; border-radius: 10px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-size: 14px; }
    .ct-ok  { padding: 10px 12px; border-radius: 10px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 14px; text-align: center; font-weight: 500; }

    .ct-go { height: 48px; border: 0; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; color: #fff;
             background: linear-gradient(90deg, var(--primary, #6c90d9), var(--sky, #8fb0ea));
             box-shadow: 0 8px 18px rgba(108,144,217,.35); transition: transform .1s, opacity .15s; }
    .ct-go:hover:not(:disabled) { transform: translateY(-1px); filter: none; }
    .ct-go:disabled { opacity: .6; cursor: wait; }

    .ct-alt { text-align: center; margin: 22px 0 0; color: var(--muted, #8892a8); font-size: 14px; }
    .ct-alt a { color: var(--primary-dark, #4d71bd); font-weight: 700; text-decoration: none; }
    .ct-alt a:hover { text-decoration: underline; }

    .ct-tag { max-width: 420px; margin: 22px 0 0; color: #5a6a8a; font-size: 14px; }
    .ct-foot { margin-top: 10px; color: var(--muted, #8892a8); }

    @media (max-width: 480px) {
      .ct-card { padding: 28px 22px; border-radius: 18px; }
      .ct-logo { height: 92px; }
    }
  `],
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  company = COMPANY;
  logoFailed = false;
  organization = ''; email = ''; password = ''; confirm = '';
  error = ''; success = ''; busy = false;

  async submit() {
    this.error = '';
    this.success = '';
    const org = this.organization.trim();
    if (org.length < 2) { this.error = 'Please enter your organization or company name.'; return; }
    if (this.password.length < 6) { this.error = 'Password must be at least 6 characters.'; return; }
    if (this.password !== this.confirm) { this.error = 'Passwords do not match.'; return; }

    this.busy = true;
    try {
      await this.auth.register(this.email, this.password, org);
      this.success = 'Account created successfully!';
      setTimeout(() => this.router.navigate(['/login'], { queryParams: { registered: '1' } }), 1500);
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      this.error = /already registered|already been registered/i.test(msg)
        ? 'That email is already registered. Try logging in.'
        : 'Could not create the account: ' + (e?.code ?? msg);
      this.busy = false;
    }
  }
}