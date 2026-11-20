/* ==========================================================================
   Interactivity for the portfolio site

   0. Storage helper - safe localStorage access used by every feature
  0b. Fetch helper   - fetchJSON with a timeout and a session cache, shared
                       by both API sections
   1. Theme toggle   - light / dark, remembered between visits
   2. Contact form   - validation and feedback (front-end only, no backend)
   3. Scroll spy     - highlights the nav link for the section in view
   4. Projects       - cards built from an array, with category filter,
                       level selector, search and sort; every choice is
                       remembered between visits
   5. GitHub repos   - latest public repos fetched from the GitHub API,
                       cached for 10 minutes, with loading, error and retry
   6. Scroll reveal  - sections fade in as they scroll into view
   7. Visit timer    - how long the visitor has had the page open
   8. Simulated login- log in, then give a name that is greeted and
                       remembered; log out clears both
   9. Show / hide    - every section can be collapsed, remembered between
                       visits

   All animation is skipped for visitors who have asked their system for
   reduced motion (see prefersReducedMotion and the CSS media query).

   Smooth scrolling is not here on purpose: it is one line of CSS
   (scroll-behavior: smooth in css/styles.css), so writing it again in
   JavaScript would mean two implementations of the same thing.
   ========================================================================== */

'use strict';

// True when the visitor has turned on "Reduce motion" in their system
// settings. matchMedia runs the same test as the CSS media query.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   0. Storage helper
   Every feature that remembers something goes through this object. Storage
   can be blocked (private browsing, strict settings), and that must never
   break the page, so the try/catch lives here once instead of in every
   feature. A blocked read returns null; a blocked write is simply skipped.
   -------------------------------------------------------------------------- */
const storage = {
  get: function (key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set: function (key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      /* Ignored: the setting still applies for this visit. */
    }
  },
  remove: function (key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      /* Ignored. */
    }
  }
};

/* --------------------------------------------------------------------------
   0b. Fetch helper
   Both API sections (GitHub and weather) load data the same way, so the
   shared parts live here once:
     - timeoutMs:  give up after a few seconds instead of "Loading..." forever
     - cacheKey / maxAgeMs: reuse a recent answer from sessionStorage, so a
       reload does not spend another API request
     - errors become short codes ('timeout', 'rate-limit', 'http-404',
       'network') that friendlyError() turns into a sentence for the visitor
   -------------------------------------------------------------------------- */
async function fetchJSON(url, options) {
  const settings = Object.assign({ timeoutMs: 8000, cacheKey: null, maxAgeMs: 0 }, options);

  // 1. A recent enough copy in sessionStorage is returned straight away.
  if (settings.cacheKey) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(settings.cacheKey));
      if (cached && Date.now() - cached.savedAt < settings.maxAgeMs) {
        return cached.data;
      }
    } catch (error) {
      /* No usable copy: fall through to the network. */
    }
  }

  // 2. AbortController lets the code cancel a request that takes too long.
  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, settings.timeoutMs);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    throw new Error(error.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }

  // 3. fetch only rejects when no answer arrives at all. An answer such as
  //    404 or 403 still has to be checked here.
  if (!response.ok) {
    const limited = response.status === 403 || response.status === 429;
    throw new Error(limited ? 'rate-limit' : 'http-' + response.status);
  }

  const data = await response.json();

  // 4. Save a copy with the time it was saved, for step 1 next time.
  if (settings.cacheKey) {
    try {
      sessionStorage.setItem(settings.cacheKey, JSON.stringify({ savedAt: Date.now(), data: data }));
    } catch (error) {
      /* The cache is a bonus; the data is still shown. */
    }
  }

  return data;
}

// Turns an error code from fetchJSON into a sentence for the visitor.
// service: who was asked ('GitHub'); what: what was asked for ('repositories').
function friendlyError(error, service, what) {
  switch (error.message) {
    case 'rate-limit':
      return service + ' is limiting requests right now. Wait a minute, then try again.';
    case 'timeout':
      return service + ' took too long to answer. Try again in a moment.';
    default:
      return 'Could not load ' + what + '. Check your internet connection and try again.';
  }
}

// Shows an error message with a Retry button inside a status element, the
// same way in every API section.
function showStatusError(status, message, retry) {
  status.className = 'repo-status error';

  const text = document.createElement('p');
  text.textContent = message;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'retry-btn';
  button.textContent = 'Retry';
  button.addEventListener('click', retry);

  status.replaceChildren(text, button);
}

/* --------------------------------------------------------------------------
   1. Theme toggle
   The starting theme is chosen by the small script in <head> before the page
   is painted. This function only deals with the button.
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const button = document.getElementById('theme-toggle');
  const root = document.documentElement;

  if (!button) return;

  // Keeps the button's pressed state in step with the theme on <html>.
  function syncButton() {
    const isDark = root.getAttribute('data-theme') === 'dark';
    button.setAttribute('aria-pressed', String(isDark));
  }

  button.addEventListener('click', function () {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);

    // Remember the choice for the next visit.
    storage.set('theme', next);

    syncButton();
  });

  syncButton();
}

/* --------------------------------------------------------------------------
   2. Contact form
   There is no server behind this form, so submitting never sends anything.
   The script validates the fields and says plainly what happened.
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('contact-form');

  if (!form) return;

  const status = document.getElementById('form-status');
  const fields = Array.from(form.querySelectorAll('input, textarea'));
  const MIN_MESSAGE_LENGTH = 10;

  // Checking on blur only starts after the first submit attempt, so nobody is
  // told a field is empty before they have had the chance to fill it in.
  let checkOnBlur = false;

  function labelFor(field) {
    const label = form.querySelector('label[for="' + field.id + '"]');
    return label ? label.textContent.trim() : 'This field';
  }

  // novalidate hides the browser's own pop-ups but it still checks the fields,
  // and field.validity is where that result is read from. That keeps the
  // browser's email parsing instead of a hand-written pattern.
  function errorFor(field) {
    if (field.validity.valueMissing) {
      return labelFor(field) + ' is required.';
    }

    if (field.validity.typeMismatch) {
      return 'Enter a valid email address, for example name@example.com.';
    }

    if (field.id === 'message' && field.value.trim().length < MIN_MESSAGE_LENGTH) {
      return 'Please write at least ' + MIN_MESSAGE_LENGTH + ' characters.';
    }

    return '';
  }

  // Shows or clears one field's message. Returns true when the field is valid.
  function showError(field, message) {
    const box = document.getElementById(field.id + '-error');

    if (box) {
      box.textContent = message;
    }

    if (message) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }

    return message === '';
  }

  function setStatus(text, isSuccess) {
    status.textContent = text;

    // A CSS animation only plays when its class is added. If the success class
    // is already there from an earlier submit, it is removed first and
    // offsetWidth is read, which makes the browser apply that removal before
    // the class goes back on, so the message slides in again every time.
    status.className = 'form-status';
    void status.offsetWidth;
    status.className = isSuccess ? 'form-status success' : 'form-status';
  }

  form.addEventListener('submit', function (event) {
    // Without this the browser tries to send the form to a server that does
    // not exist, which reloads the page with the fields stuck in the URL.
    event.preventDefault();
    checkOnBlur = true;

    const invalid = fields.filter(function (field) {
      return !showError(field, errorFor(field));
    });

    if (invalid.length > 0) {
      setStatus('', false);
      invalid[0].focus();
      return;
    }

    const name = document.getElementById('name').value.trim();

    setStatus(
      'Thanks, ' + name + '. This form is front-end only, so your message was '
        + 'not sent anywhere.',
      true
    );

    form.reset();
    fields.forEach(function (field) {
      showError(field, '');
    });
    checkOnBlur = false;
  });

  fields.forEach(function (field) {
    field.addEventListener('blur', function () {
      if (checkOnBlur) {
        showError(field, errorFor(field));
      }
    });

    // Clear a message as soon as the field becomes valid again.
    field.addEventListener('input', function () {
      if (checkOnBlur && field.hasAttribute('aria-invalid')) {
        showError(field, errorFor(field));
      }
    });
  });
}

/* --------------------------------------------------------------------------
   3. Scroll spy
   IntersectionObserver reports when a section enters or leaves the viewport.
   The browser does that work itself, so there is no scroll handler measuring
   positions on every frame.
   -------------------------------------------------------------------------- */
function initScrollSpy() {
  const links = Array.from(document.querySelectorAll('.nav-links a'));

  if (links.length === 0 || !('IntersectionObserver' in window)) return;

  // Which link belongs to which section.
  const linkFor = new Map();

  links.forEach(function (link) {
    const section = document.querySelector(link.getAttribute('href'));

    if (section) {
      linkFor.set(section, link);
    }
  });

  function activate(link) {
    links.forEach(function (other) {
      other.classList.remove('active');
    });
    link.classList.add('active');
  }

  // rootMargin narrows the area that counts as "on screen" to a band across
  // the middle of the viewport. Without it the highlight flickers whenever
  // two sections are partly visible at the same time.
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        activate(linkFor.get(entry.target));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  linkFor.forEach(function (link, section) {
    observer.observe(section);
  });
}

/* --------------------------------------------------------------------------
   4. Projects
   The projects live in one array instead of being written out in the HTML.
   Every time something changes, the grid is rebuilt in four steps:
     1. keep projects in the chosen category   (All / Software / Hardware)
     2. keep projects at the chosen level      (Any / Beginner / Medium / Hard)
     3. keep projects that match the search text
     4. sort what is left                      (Newest / Oldest / Title A-Z)
   -------------------------------------------------------------------------- */
const projects = [
  {
    title: 'TermFS',
    category: 'software',
    level: 'beginner',
    date: '2025-12',
    tags: ['Java', 'CLI', 'data structures', 'hash table', 'KMP'],
    image: 'assets/images/project-placeholder.svg',
    description: 'A terminal-based file system simulator that recreates UNIX commands such as '
      + 'mkdir, cd, ls, rm, tree and grep. Files and folders are stored in a tree, each '
      + 'folder uses a hash table for fast lookups, and grep uses the KMP search algorithm.'
  },
  {
    title: 'Classroom Reservation System',
    category: 'software',
    level: 'medium',
    date: '2025-05',
    tags: ['Java', 'desktop app', 'booking', 'admin panel'],
    image: 'assets/images/project-placeholder.svg',
    description: 'A desktop app for booking KFUPM classrooms. Users can sign up, browse available '
      + 'rooms and request a time slot, while admins add and edit rooms and approve or '
      + 'reject reservation requests.'
  },
  {
    title: 'Digital Queue Management System',
    category: 'hardware',
    level: 'hard',
    date: '2026-05',
    tags: ['Verilog', 'FPGA', 'digital logic', '7-segment display'],
    image: 'assets/images/project-placeholder.svg',
    description: 'A ticket and queue system, like the ones used in banks and clinics, running on an '
      + 'FPGA board. It issues tickets, calls the next customer, shows the queue on '
      + '7-segment displays and uses LEDs to signal when the queue is full.'
  }
];

// What each level is called on the cards, and the message shown above the
// grid when the visitor picks it. 'all' has no message.
const LEVELS = {
  beginner: {
    label: 'Beginner',
    message: 'Beginner projects: where I learned the basics of logic, without building a user interface.'
  },
  medium: {
    label: 'Medium',
    message: 'Medium projects: where I learned to build a complete front end, with both logic and interface, but no back end.'
  },
  hard: {
    label: 'Hard',
    message: 'Hard projects: where I learned to work with low-level logic gates to build complex logic.'
  }
};

// How each sort option orders two projects. Dates are 'YYYY-MM' strings,
// which sort correctly as plain text, so they need no parsing.
const SORTERS = {
  newest: function (a, b) { return b.date.localeCompare(a.date); },
  oldest: function (a, b) { return a.date.localeCompare(b.date); },
  title: function (a, b) { return a.title.localeCompare(b.title); }
};

// '2025-12' -> 'Dec 2025'
function formatMonth(yearMonth) {
  const parts = yearMonth.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
    .toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function initProjects() {
  const grid = document.getElementById('project-grid');
  const count = document.getElementById('project-count');
  const search = document.getElementById('project-search');
  // [data-filter] and [data-level] keep the two button rows apart, since
  // both use the same .filter-btn style.
  const buttons = Array.from(document.querySelectorAll('.filter-btn[data-filter]'));
  const levelButtons = Array.from(document.querySelectorAll('.filter-btn[data-level]'));
  const levelMessage = document.getElementById('level-message');
  const empty = document.getElementById('project-empty');
  const emptyText = document.getElementById('project-empty-text');
  const clearButton = document.getElementById('clear-search');
  const sortSelect = document.getElementById('project-sort');

  if (!grid || !count || !search || !empty || !sortSelect || !levelMessage) return;

  // The category currently selected: 'all', 'software' or 'hardware'.
  let activeFilter = 'all';
  const FILTER_KEY = 'projectFilter';

  // The level currently selected: 'all', 'beginner', 'medium' or 'hard'.
  let activeLevel = 'all';
  const LEVEL_KEY = 'projectLevel';

  // Marks the chosen level's button as pressed, like setFilter does.
  function setLevel(value) {
    activeLevel = value;
    levelButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.level === value));
    });
  }

  // The sort order currently selected: 'newest', 'oldest' or 'title'.
  let activeSort = 'newest';
  const SORT_KEY = 'projectSort';

  // Selects a category and marks its button as pressed. The CSS styles
  // follow aria-pressed, so this is all it takes to update the buttons.
  function setFilter(value) {
    activeFilter = value;
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === value));
    });
  }

  // Restore the filter chosen on the last visit. It is only used if a button
  // with that value still exists, so an old or edited value cannot break the page.
  const saved = storage.get(FILTER_KEY);
  const isKnown = buttons.some(function (button) {
    return button.dataset.filter === saved;
  });
  if (isKnown) {
    setFilter(saved);
  }

  // Restore the level the same way: 'all' or one of the LEVELS keys.
  const savedLevel = storage.get(LEVEL_KEY);
  if (savedLevel === 'all' || Object.prototype.hasOwnProperty.call(LEVELS, savedLevel)) {
    setLevel(savedLevel);
  }

  // Restore the sort order the same way: only if it is still a real option.
  const savedSort = storage.get(SORT_KEY);
  if (Object.prototype.hasOwnProperty.call(SORTERS, savedSort)) {
    activeSort = savedSort;
  }
  sortSelect.value = activeSort;

  // Builds one card element from one project object. textContent is used
  // instead of innerHTML so the text is always shown as text, never run as HTML.
  // index is the card's position in the grid. It staggers the fade-in so the
  // cards appear one after another instead of all at once.
  function createCard(project, index) {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.style.animationDelay = (index * 60) + 'ms';

    const image = document.createElement('img');
    image.src = project.image;
    image.alt = project.title + ' placeholder image';

    const title = document.createElement('h3');
    title.textContent = project.title;

    // The date is shown so the visitor can see why the cards are in this order.
    const date = document.createElement('p');
    date.className = 'project-date';
    date.textContent = LEVELS[project.level].label + ' · ' + formatMonth(project.date);

    const description = document.createElement('p');
    description.textContent = project.description;

    const tagList = document.createElement('ul');
    tagList.className = 'tag-list';
    project.tags.forEach(function (tag) {
      const item = document.createElement('li');
      item.textContent = tag;
      tagList.appendChild(item);
    });

    card.append(image, title, date, description, tagList);
    return card;
  }

  // True when a project passes the category, the level and the search text.
  function matches(project, query) {
    if (activeFilter !== 'all' && project.category !== activeFilter) {
      return false;
    }

    if (activeLevel !== 'all' && project.level !== activeLevel) {
      return false;
    }

    if (query === '') {
      return true;
    }

    const searchable = (project.title + ' ' + project.tags.join(' ')).toLowerCase();
    return searchable.includes(query);
  }

  // Works out which projects to show, rebuilds the grid and updates the count.
  function render() {
    const query = search.value.trim().toLowerCase();

    // Steps 1-3 (category, level, search) are in matches(), step 4 is the sort.
    // filter() returns a new array, so sorting it never reorders `projects`.
    const visible = projects
      .filter(function (project) {
        return matches(project, query);
      })
      .sort(SORTERS[activeSort]);

    // map passes (project, index) to createCard, which uses the index for the delay.
    grid.replaceChildren(...visible.map(createCard));
    count.textContent = 'Showing ' + visible.length + ' of ' + projects.length + ' projects';

    // A different message for each level; hidden for 'all'.
    levelMessage.hidden = activeLevel === 'all';
    levelMessage.textContent = activeLevel === 'all' ? '' : LEVELS[activeLevel].message;

    // Empty state: say why the grid is blank and offer a way back.
    if (visible.length === 0) {
      emptyText.textContent = query === ''
        ? 'No projects match this category and level yet.'
        : 'No projects match "' + search.value.trim() + '".';
      clearButton.hidden = query === '';
      empty.hidden = false;
    } else {
      empty.hidden = true;
    }
  }

  clearButton.addEventListener('click', function () {
    search.value = '';
    render();
    // Put the cursor back in the search box, ready for a new search.
    search.focus();
  });

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      setFilter(button.dataset.filter);

      storage.set(FILTER_KEY, activeFilter);

      render();
    });
  });

  levelButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setLevel(button.dataset.level);
      storage.set(LEVEL_KEY, activeLevel);
      render();
    });
  });

  sortSelect.addEventListener('change', function () {
    activeSort = sortSelect.value;
    storage.set(SORT_KEY, activeSort);
    render();
  });

  // 'input' fires on every keystroke, so results update while typing.
  search.addEventListener('input', render);

  render();
}

/* --------------------------------------------------------------------------
   5. GitHub repos
   fetch() asks the GitHub API for my public repositories. The answer arrives
   later, so the section has three states: loading, success and error.
   -------------------------------------------------------------------------- */
const GITHUB_USER = 'MJBukannan';
const REPO_LIMIT = 6;

function initGitHubRepos() {
  const list = document.getElementById('repo-list');
  const status = document.getElementById('repo-status');

  if (!list || !status) return;

  // sort=updated puts the most recently changed repos first.
  const url = 'https://api.github.com/users/' + GITHUB_USER + '/repos?sort=updated&per_page=100';

  // 2026-10-14T05:51:00Z -> 14 Oct 2026
  function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Builds one repo card. Like the project cards, all text goes in through
  // textContent, because it comes from outside the site.
  function createRepoCard(repo) {
    const item = document.createElement('li');
    item.className = 'repo-card';

    const link = document.createElement('a');
    link.href = repo.html_url;
    link.target = '_blank';
    // noopener stops the new tab from being able to control this page.
    link.rel = 'noopener';
    link.textContent = repo.name;

    const title = document.createElement('h3');
    title.appendChild(link);

    const description = document.createElement('p');
    description.textContent = repo.description || 'No description yet.';

    const meta = document.createElement('p');
    meta.className = 'repo-meta';
    meta.textContent = (repo.language || 'Language not set') + ' · Updated ' + formatDate(repo.pushed_at || repo.updated_at);

    item.append(title, description, meta);
    return item;
  }

  // async lets the function wait for the network with await, without
  // freezing the page while it waits.
  async function loadRepos() {
    list.replaceChildren();
    status.className = 'repo-status';
    status.textContent = 'Loading repositories…';

    try {
      // Cached for 10 minutes: GitHub allows 60 requests an hour without a key.
      const repos = await fetchJSON(url, { cacheKey: 'githubRepos', maxAgeMs: 10 * 60 * 1000 });

      // Forks are other people's projects, so they are left out.
      const latest = repos.filter(function (repo) {
        return !repo.fork;
      }).slice(0, REPO_LIMIT);

      if (latest.length === 0) {
        status.textContent = 'No public repositories yet.';
        return;
      }

      status.replaceChildren();
      list.replaceChildren(...latest.map(createRepoCard));
    } catch (error) {
      showStatusError(status, friendlyError(error, 'GitHub', 'repositories'), loadRepos);
    }
  }

  loadRepos();
}

/* --------------------------------------------------------------------------
   6. Scroll reveal
   Each section starts slightly lower and transparent, then fades up the first
   time it scrolls into view. The hidden starting state is added here, not in
   the HTML, so without JavaScript (or with reduced motion) every section is
   simply visible.
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  const sections = Array.from(document.querySelectorAll('.section'));

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Each section only needs to animate once, so stop watching it.
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  sections.forEach(function (section) {
    section.classList.add('reveal');
    observer.observe(section);
  });
}

/* --------------------------------------------------------------------------
   7. Visit timer
   Shows how long the visitor has been on the page. It only counts while the
   tab is visible: switching tabs pauses it, and coming back resumes it from
   the same time. Time is measured with performance.now() instead of counting
   ticks, because browsers slow down timers in background tabs.
   -------------------------------------------------------------------------- */
function initVisitTimer() {
  const output = document.getElementById('visit-timer');

  if (!output) return;

  let countedMs = 0;     // time from earlier visible stretches
  let startedAt = 0;     // when the current visible stretch began
  let intervalId = null; // the running setInterval, or null while paused

  // 42 -> "42s", 133 -> "2m 13s", 3754 -> "1h 2m 34s"
  function format(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return hours + 'h ' + minutes + 'm ' + seconds + 's';
    if (minutes > 0) return minutes + 'm ' + seconds + 's';
    return seconds + 's';
  }

  function show() {
    const totalMs = countedMs + (performance.now() - startedAt);
    output.textContent = 'You have been here for ' + format(Math.floor(totalMs / 1000));
  }

  function start() {
    startedAt = performance.now();
    show();
    intervalId = setInterval(show, 1000);
  }

  function pause() {
    // Bank the time from this stretch before stopping.
    countedMs += performance.now() - startedAt;
    clearInterval(intervalId);
    intervalId = null;
  }

  // Fires when the tab is hidden (switched away, minimised) or shown again.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && intervalId !== null) {
      pause();
    } else if (!document.hidden && intervalId === null) {
      start();
    }
  });

  // A page can load in a background tab; only start counting once it is seen.
  if (!document.hidden) start();
}

/* --------------------------------------------------------------------------
   8. Simulated login
   The page has two states, logged out and logged in, saved with the storage
   helper so they survive a reload. Logging in takes two steps in a dialog:
     1. username + password (any non-empty values work; nothing is sent)
     2. "What should I call you?" -> the name is greeted in the About section
        and filled into the contact form
   Logging out clears both the login and the name.
   -------------------------------------------------------------------------- */
const MAX_NAME_LENGTH = 40;

function initLogin() {
  const button = document.getElementById('login-button');
  const dialog = document.getElementById('login-dialog');
  const loginForm = document.getElementById('login-form');
  const nameForm = document.getElementById('name-form');
  const username = document.getElementById('login-username');
  const password = document.getElementById('login-password');
  const nameInput = document.getElementById('visitor-name');
  const greeting = document.getElementById('greeting');
  const contactName = document.getElementById('name');

  if (!button || !dialog || !loginForm || !nameForm || !greeting) return;

  // Shows or clears the message under one field. Returns true when valid.
  function check(field, message) {
    const box = document.getElementById(field.id + '-error');
    box.textContent = message;
    if (message) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
    return message === '';
  }

  function isLoggedIn() {
    return storage.get('loggedIn') === 'true';
  }

  // Makes the page match the saved state: button text, greeting, contact name.
  function render() {
    const name = storage.get('visitorName');

    if (isLoggedIn() && name) {
      button.textContent = 'Log out';
      greeting.textContent = 'Welcome back, ' + name + '!';
      greeting.hidden = false;
      // Only fill the contact form if the visitor has not typed in it.
      if (contactName && contactName.value === '') contactName.value = name;
    } else {
      button.textContent = 'Log in';
      greeting.hidden = true;
      greeting.textContent = '';
    }
  }

  // Opens the dialog on step 1 with empty fields.
  function openLogin() {
    loginForm.reset();
    check(username, '');
    check(password, '');
    loginForm.hidden = false;
    nameForm.hidden = true;
    dialog.showModal();
    username.focus();
  }

  function logOut() {
    if (contactName && contactName.value === storage.get('visitorName')) {
      contactName.value = '';
    }
    storage.remove('loggedIn');
    storage.remove('visitorName');
    render();
  }

  button.addEventListener('click', function () {
    if (isLoggedIn()) {
      logOut();
    } else {
      openLogin();
    }
  });

  // Step 1: both fields must be filled in. Nothing is checked against a
  // real account, because there is no server.
  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const userOk = check(username, username.value.trim() === '' ? 'Username is required.' : '');
    const passOk = check(password, password.value === '' ? 'Password is required.' : '');

    if (!userOk) { username.focus(); return; }
    if (!passOk) { password.focus(); return; }

    // Logged in. The username is saved as the name for now, so the visitor
    // is still greeted if they close the dialog before step 2.
    storage.set('loggedIn', 'true');
    storage.set('visitorName', username.value.trim().slice(0, MAX_NAME_LENGTH));

    // Step 2: ask for the name, starting from the username.
    loginForm.hidden = true;
    nameForm.hidden = false;
    nameInput.value = username.value.trim().slice(0, MAX_NAME_LENGTH);
    check(nameInput, '');
    nameInput.focus();
    nameInput.select();
  });

  nameForm.addEventListener('submit', function (event) {
    event.preventDefault();

    // Collapse repeated spaces and cap the length.
    const name = nameInput.value.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);

    if (!check(nameInput, name === '' ? 'Please enter a name.' : '')) {
      nameInput.focus();
      return;
    }

    storage.set('visitorName', name);
    dialog.close();
  });

  document.getElementById('login-cancel').addEventListener('click', function () {
    dialog.close();
  });

  // 'close' fires however the dialog closes (Save, Cancel or Escape), so the
  // page is always brought up to date here.
  dialog.addEventListener('close', function () {
    render();
    button.focus();
  });

  render();
}

/* --------------------------------------------------------------------------
   9. Show / hide sections
   Any button with data-toggle="<id>" hides or shows that element. The ids
   of the hidden parts are saved as a JSON list, so a hidden section is
   still hidden on the next visit.
   -------------------------------------------------------------------------- */
function initSectionToggles() {
  const buttons = Array.from(document.querySelectorAll('[data-toggle]'));

  if (buttons.length === 0) return;

  // Read the saved list. A missing or broken value just means nothing is hidden.
  let hiddenIds = [];
  try {
    const saved = JSON.parse(storage.get('hiddenSections'));
    if (Array.isArray(saved)) hiddenIds = saved;
  } catch (error) {
    /* Not valid JSON: start with everything shown. */
  }

  // Makes one button and its target match the list.
  function apply(button) {
    const target = document.getElementById(button.dataset.toggle);
    if (!target) return;

    const isHidden = hiddenIds.includes(target.id);
    target.hidden = isHidden;
    button.textContent = isHidden ? 'Show' : 'Hide';
    // aria-expanded tells screen readers whether the part is open.
    button.setAttribute('aria-expanded', String(!isHidden));
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      const id = button.dataset.toggle;

      // Remove the id if it is in the list, add it if it is not.
      hiddenIds = hiddenIds.includes(id)
        ? hiddenIds.filter(function (item) { return item !== id; })
        : hiddenIds.concat(id);

      storage.set('hiddenSections', JSON.stringify(hiddenIds));
      apply(button);
    });

    apply(button);
  });
}

/* The script tag uses defer, so the HTML is already parsed by this point. */
initThemeToggle();
initContactForm();
initScrollSpy();
initProjects();
initGitHubRepos();
initScrollReveal();
initVisitTimer();
initLogin();
initSectionToggles();
