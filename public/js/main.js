const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const checkoutStatus = document.getElementById('checkout-status');
const assistInput = document.getElementById('assist-input');
const assistBtn = document.getElementById('assist-btn');
const assistReply = document.getElementById('assist-reply');
const assistResults = document.getElementById('assist-results');
const rewardsSignup = document.getElementById('rewards-signup');
const rewardsLogin = document.getElementById('rewards-login');
const rewardsSignupStatus = document.getElementById('rewards-signup-status');
const rewardsProfile = document.getElementById('rewards-profile');
const navToggle = document.querySelector('.nav-toggle');
const navPanel = document.getElementById('nav-panel');
const footerYear = document.getElementById('footer-year');
const installBanner = document.getElementById('install-banner');
const installBtn = document.getElementById('install-btn');
const installDismiss = document.getElementById('install-dismiss');
const iosBanner = document.getElementById('ios-install');
const iosDismiss = document.getElementById('ios-dismiss');
const backToTop = document.getElementById('back-to-top');

let deferredPrompt = null;

function appendChatLine(text, type = 'user') {
  const line = document.createElement('div');
  line.className = `chat-line ${type}`;
  line.textContent = text;
  chatBox.appendChild(line);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendChat() {
  const message = input.value.trim();
  if (!message) return;

  appendChatLine(`You: ${message}`, 'user');
  input.value = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    appendChatLine(`Blade: ${data.reply}`, 'bot');
  } catch (error) {
    appendChatLine('Blade: Connection issue. Try again in a moment.', 'bot');
  }
}

async function handleCheckout(productId) {
  checkoutStatus.textContent = 'Creating secure checkout...';

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });

    const data = await response.json();

    if (!response.ok) {
      checkoutStatus.textContent = data.message || 'Checkout is not available yet.';
      return;
    }

    window.location.href = data.url;
  } catch (error) {
    checkoutStatus.textContent = 'Checkout failed. Please try again.';
  }
}

sendBtn?.addEventListener('click', sendChat);
input?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    sendChat();
  }
});

document.querySelectorAll('[data-product]').forEach((button) => {
  button.addEventListener('click', () => handleCheckout(button.dataset.product));
});

function toggleNav(open) {
  if (!navToggle || !navPanel) return;
  const shouldOpen = typeof open === 'boolean' ? open : !navPanel.classList.contains('is-open');
  navPanel.classList.toggle('is-open', shouldOpen);
  navToggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
}

navToggle?.addEventListener('click', () => toggleNav());
navPanel?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => toggleNav(false));
});
document.addEventListener('click', (event) => {
  if (!navPanel || !navToggle) return;
  if (!navPanel.classList.contains('is-open')) return;
  if (navPanel.contains(event.target) || navToggle.contains(event.target)) return;
  toggleNav(false);
});

async function runAssist() {
  const query = assistInput?.value.trim();
  if (!query) return;

  if (assistReply) {
    assistReply.textContent = 'Searching...';
  }
  if (assistResults) {
    assistResults.innerHTML = '';
  }

  try {
    const response = await fetch('/api/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    if (assistReply) {
      assistReply.textContent = data.reply || 'Here is what I found.';
    }
    if (assistResults && Array.isArray(data.matches)) {
      data.matches.forEach((match) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${match.id}`;
        link.textContent = `${match.title} — ${match.summary}`;
        item.appendChild(link);
        assistResults.appendChild(item);
      });
    }
  } catch (error) {
    if (assistReply) {
      assistReply.textContent = 'Search failed. Please try again.';
    }
  }
}

assistBtn?.addEventListener('click', runAssist);
assistInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    runAssist();
  }
});

async function handleRewardsSignup(event) {
  event.preventDefault();
  const formData = new FormData(rewardsSignup);
  const name = formData.get('name');
  const email = formData.get('email');

  rewardsSignupStatus.textContent = 'Creating your rewards profile...';

  try {
    const response = await fetch('/api/rewards/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await response.json();
    rewardsSignupStatus.textContent = data.message || 'Welcome to Blade Rewards.';
    if (data.member) {
      rewardsProfile.innerHTML = `<strong>${data.member.name}</strong><br />Member code: ${data.member.member_code}<br />Points: ${data.member.points}`;
    }
  } catch (error) {
    rewardsSignupStatus.textContent = 'Signup failed. Try again.';
  }
}

async function handleRewardsLogin(event) {
  event.preventDefault();
  const formData = new FormData(rewardsLogin);
  const email = formData.get('email');
  const code = formData.get('code');

  rewardsProfile.textContent = 'Checking your rewards...';

  try {
    const response = await fetch('/api/rewards/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json();
    if (!response.ok) {
      rewardsProfile.textContent = data.message || 'Login failed.';
      return;
    }
    rewardsProfile.innerHTML = `<strong>${data.member.name}</strong><br />Points: ${data.member.points}<br />Member code: ${data.member.member_code}`;
  } catch (error) {
    rewardsProfile.textContent = 'Login failed. Try again.';
  }
}

rewardsSignup?.addEventListener('submit', handleRewardsSignup);
rewardsLogin?.addEventListener('submit', handleRewardsLogin);

if (footerYear) {
  footerYear.textContent = `${new Date().getFullYear()}`;
}

function showInstallBanner() {
  if (installBanner && !localStorage.getItem('jb_install_dismissed')) {
    installBanner.style.display = 'flex';
  }
}

function hideInstallBanner() {
  if (installBanner) {
    installBanner.style.display = 'none';
  }
}

function showIosBanner() {
  if (iosBanner && !localStorage.getItem('jb_ios_dismissed')) {
    iosBanner.style.display = 'flex';
  }
}

function hideIosBanner() {
  if (iosBanner) {
    iosBanner.style.display = 'none';
  }
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  showInstallBanner();
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  hideInstallBanner();
});

installDismiss?.addEventListener('click', hideInstallBanner);
installDismiss?.addEventListener('click', () => {
  localStorage.setItem('jb_install_dismissed', '1');
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  hideInstallBanner();
});

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
if (isIos && !isStandalone) {
  showIosBanner();
}
iosDismiss?.addEventListener('click', () => {
  localStorage.setItem('jb_ios_dismissed', '1');
  hideIosBanner();
});

function updateBackToTop() {
  if (!backToTop) return;
  if (window.scrollY > 600) {
    backToTop.classList.add('is-visible');
  } else {
    backToTop.classList.remove('is-visible');
  }
}

window.addEventListener('scroll', updateBackToTop);
updateBackToTop();

const revealTargets = document.querySelectorAll(
  '.section, .hero-card, .product, .staff-card, .review-card, .franchise-card, .franchise-slider, .rewards-card, .app-card, .app-screen'
);

revealTargets.forEach((el) => el.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => revealObserver.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}

const franchiseSlider = document.querySelector('.franchise-slider');
if (franchiseSlider) {
  const slides = Array.from(franchiseSlider.querySelectorAll('.franchise-slide'));
  const titleEl = document.getElementById('franchise-slide-title');
  const copyEl = document.getElementById('franchise-slide-copy');
  const dotsContainer = document.getElementById('franchise-dots');
  const intervalMs = Number(franchiseSlider.dataset.interval || 5200);
  let index = slides.findIndex((slide) => slide.classList.contains('is-active'));
  if (index < 0) index = 0;
  let timerId = null;

  const updateCaption = (slide) => {
    if (titleEl) titleEl.textContent = slide.dataset.title || '';
    if (copyEl) copyEl.textContent = slide.dataset.copy || '';
  };

  const updateDots = () => {
    if (!dotsContainer) return;
    dotsContainer.querySelectorAll('button').forEach((button, idx) => {
      button.classList.toggle('is-active', idx === index);
      button.setAttribute('aria-selected', idx === index ? 'true' : 'false');
      button.setAttribute('tabindex', idx === index ? '0' : '-1');
    });
  };

  const showSlide = (nextIndex) => {
    slides[index]?.classList.remove('is-active');
    index = nextIndex;
    slides[index]?.classList.add('is-active');
    updateCaption(slides[index]);
    updateDots();
  };

  const startTimer = () => {
    if (timerId) return;
    timerId = window.setInterval(() => {
      const next = (index + 1) % slides.length;
      showSlide(next);
    }, intervalMs);
  };

  const stopTimer = () => {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((slide, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', slide.dataset.title || `Slide ${idx + 1}`);
      button.addEventListener('click', () => {
        showSlide(idx);
        stopTimer();
        startTimer();
      });
      dotsContainer.appendChild(button);
    });
  }

  updateCaption(slides[index]);
  updateDots();
  startTimer();

  franchiseSlider.addEventListener('mouseenter', stopTimer);
  franchiseSlider.addEventListener('mouseleave', startTimer);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/js/sw.js').catch(() => {});
  });
}
