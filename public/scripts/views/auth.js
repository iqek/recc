import { api } from '../api.js';
import { escapeHtml } from '../render.js';

export async function authView(root) {
  let mode = 'login';
  let error = '';

  render();

  function render() {
    root.innerHTML = `
      <div class="panel" style="max-width:340px;margin:40px auto;">
        <h2 class="page-title">${mode === 'login' ? 'Log in' : 'Create account'}</h2>
        ${error ? `<div class="notice">${escapeHtml(error)}</div>` : ''}
        <form id="auth-form" style="display:flex;flex-direction:column;gap:8px;">
          <input type="text" id="username" placeholder="Username" autocomplete="username" required />
          <input type="password" id="password" placeholder="Password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required />
          <button type="submit" class="btn btn-primary">${mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
        <p class="subtle" style="margin-top:12px;">
          ${mode === 'login' ? "No account?" : 'Have an account?'}
          <a href="#" id="toggle-mode">${mode === 'login' ? 'Create one' : 'Log in'}</a>
        </p>
      </div>
    `;
    root.querySelectorAll('input').forEach((el) => (el.style.cssText = 'font-family:var(--font-mono);font-size:17px;padding:6px 9px;border:var(--border);background:#fff;'));

    root.querySelector('#auth-form').addEventListener('submit', onSubmit);
    root.querySelector('#toggle-mode').addEventListener('click', (e) => {
      e.preventDefault();
      mode = mode === 'login' ? 'register' : 'login';
      error = '';
      render();
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    const username = root.querySelector('#username').value.trim();
    const password = root.querySelector('#password').value;
    try {
      if (mode === 'login') await api.login(username, password);
      else await api.register(username, password);
      location.hash = '#/';
      location.reload();
    } catch (err) {
      error = err.message;
      render();
    }
  }
}
