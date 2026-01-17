const tokenInput = document.getElementById('admin-token');
const contentJson = document.getElementById('content-json');
const contentStatus = document.getElementById('content-status');
const analyticsList = document.getElementById('analytics-list');
const memberList = document.getElementById('member-list');
const pointsEmail = document.getElementById('points-email');
const pointsValue = document.getElementById('points-value');
const pointsStatus = document.getElementById('points-status');

const getToken = () => tokenInput?.value.trim() || '';

async function callAdmin(endpoint, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const token = getToken();
  if (token) {
    headers['x-blade-token'] = token;
  }
  return fetch(endpoint, { ...options, headers });
}

async function loadContent() {
  try {
    const response = await callAdmin('/api/site-content');
    const data = await response.json();
    if (!response.ok) {
      contentStatus.textContent = data.message || 'Access denied.';
      return;
    }
    contentJson.value = JSON.stringify(data, null, 2);
    contentStatus.textContent = 'Loaded current site content.';
  } catch (error) {
    contentStatus.textContent = 'Unable to load site content.';
  }
}

async function saveContent() {
  if (!contentJson.value.trim()) {
    contentStatus.textContent = 'Please provide sections JSON.';
    return;
  }
  try {
    const body = JSON.parse(contentJson.value);
    const response = await callAdmin('/api/site-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    contentStatus.textContent = data.message || 'Saved.';
  } catch (error) {
    contentStatus.textContent = 'Invalid JSON or request failed.';
  }
}

async function refreshAnalytics() {
  analyticsList.innerHTML = '';
  const response = await callAdmin('/api/analytics');
  const data = await response.json();
  if (!response.ok) {
    analyticsList.innerHTML = `<li>${data.message || 'Access denied.'}</li>`;
    return;
  }
  data.results.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.query} (${item.count})`;
    analyticsList.appendChild(li);
  });
}

async function refreshMembers() {
  memberList.innerHTML = '';
  const response = await callAdmin('/api/rewards/list');
  const data = await response.json();
  if (!response.ok) {
    memberList.innerHTML = `<li>${data.message || 'Access denied.'}</li>`;
    return;
  }
  data.members.forEach((member) => {
    const li = document.createElement('li');
    li.textContent = `${member.name} — ${member.email} (${member.points} pts)`;
    memberList.appendChild(li);
  });
}

async function addPoints() {
  const email = pointsEmail.value.trim();
  const points = Number(pointsValue.value || 0);
  if (!email || Number.isNaN(points)) {
    pointsStatus.textContent = 'Provide an email and points.';
    return;
  }
  const response = await callAdmin('/api/rewards/add-points', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, points }),
  });
  const data = await response.json();
  pointsStatus.textContent = data.message || 'Points updated.';
  if (response.ok) {
    refreshMembers();
  }
}

document.getElementById('save-content')?.addEventListener('click', saveContent);
document.getElementById('refresh-analytics')?.addEventListener('click', refreshAnalytics);
document.getElementById('refresh-members')?.addEventListener('click', refreshMembers);
document.getElementById('add-points')?.addEventListener('click', addPoints);

loadContent();
