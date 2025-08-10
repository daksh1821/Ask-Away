// basic client-side auth & API helpers
const API = {
  async post(url, body, token) {
    const headers = {'Content-Type':'application/json'};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, {method:'POST', headers, body: JSON.stringify(body)});
    return res.json();
  },
  async get(url, token) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, {headers});
    return res.json();
  },
};

function token() { return localStorage.getItem('qa_token'); }
function setToken(t) { localStorage.setItem('qa_token', t); toggleAuthLinks(); }
function clearToken(){ localStorage.removeItem('qa_token'); toggleAuthLinks(); }

function toggleAuthLinks(){
  const t = token();
  document.getElementById('link-register').style.display = t ? 'none' : '';
  document.getElementById('link-login').style.display = t ? 'none' : '';
  document.getElementById('link-logout').style.display = t ? '' : 'none';
}

window.addEventListener('load', () => {
  toggleAuthLinks();

  // Ask form
  const askForm = document.getElementById('ask-form');
  if (askForm){
    askForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('ask-title').value;
      const content = document.getElementById('ask-content').value;
      const tags = document.getElementById('ask-tags').value;
      const tok = token();
      if (!tok) { alert('Login to ask questions'); return; }
      try {
        const resp = await API.post('/api/questions', {title, content, tags}, tok);
        document.getElementById('ask-result').innerText = 'Posted! Reload to see.';
      } catch (err) { console.error(err); }
    });
  }

  // search
  const sbtn = document.getElementById('search-btn');
  if (sbtn){
    sbtn.addEventListener('click', async () => {
      const q = document.getElementById('search-input').value;
      if (!q) return;
      const results = await API.get('/api/search?q=' + encodeURIComponent(q));
      const list = document.getElementById('questions-list');
      list.innerHTML = '';
      results.forEach(r => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="/question/${r.id}">${r.title}</a> — <small>${r.tags}</small>`;
        list.appendChild(li);
      });
    });
  }

  // register page
  const reg = document.getElementById('register-form');
  if (reg){
    reg.addEventListener('submit', async (e)=> {
      e.preventDefault();
      const body = {
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        interests: document.getElementById('reg-interests').value,
        work_area: document.getElementById('reg-work').value
      };
      const res = await API.post('/api/users/register', body);
      if (res.id) {
        document.getElementById('reg-result').innerText = 'Registered! You may login now.';
      } else {
        document.getElementById('reg-result').innerText = JSON.stringify(res);
      }
    });
  }

  // login page
  const login = document.getElementById('login-form');
  if (login){
    login.addEventListener('submit', async (e)=> {
      e.preventDefault();
      const form = new FormData();
      form.append('username', document.getElementById('login-username').value);
      form.append('password', document.getElementById('login-password').value);
      const res = await fetch('/api/users/login', { method:'POST', body: form });
      const data = await res.json();
      if (data.access_token) {
        setToken(data.access_token);
        document.getElementById('login-result').innerText = 'Logged in!';
      } else {
        document.getElementById('login-result').innerText = JSON.stringify(data);
      }
    });
  }

  // logout link
  const logout = document.getElementById('link-logout');
  if (logout) logout.addEventListener('click', (e)=> { e.preventDefault(); clearToken(); location.href = '/'; });

  // try to populate personalized feed
  (async function personalized(){
    const tok = token();
    if (!tok) return;
    try {
      const feed = await API.get('/api/feed', tok);
      const area = document.getElementById('feed-area');
      if (!area) return;
      area.innerHTML = '';
      feed.forEach(q => {
        const li = document.createElement('div');
        li.innerHTML = `<a href="/question/${q.id}">${q.title}</a> — <small>${q.tags}</small>`;
        area.appendChild(li);
      });
    } catch (err) {
      console.error(err);
    }
  })();
});
