# Technical Documentation

Personal portfolio website built for SWE 363 (Web Engineering and Development),
Assignment 3: Advanced Functionality. It extends the Assignment 1 and 2 site.
The site is still a single static page with no build step, no dependencies and
no backend; the only outside services it talks to are the public GitHub API and
the Open-Meteo weather API.

## Contents

1. [Requirement map](#requirement-map)
2. [File structure](#file-structure)
3. [HTML structure](#html-structure)
4. [CSS approach](#css-approach)
5. [Responsive design](#responsive-design)
6. [Theming](#theming)
7. [JavaScript features](#javascript-features)
8. [What the site remembers](#what-the-site-remembers)
9. [Animations and reduced motion](#animations-and-reduced-motion)
10. [Accessibility](#accessibility)
11. [Performance](#performance)
12. [Browser and device testing](#browser-and-device-testing)
13. [Known limitations](#known-limitations)

## Requirement map

Where each Assignment 3 requirement is implemented (all functions are in
`js/script.js`):

| Requirement | Feature | Where |
|---|---|---|
| API integration | Live weather at KFUPM from Open-Meteo | `initWeather()`, `WEATHER_URL`, `describeWeather()`; `#weather` section in `index.html` |
| API integration | Latest GitHub repositories, now cached and with a timeout | `initGitHubRepos()`; `#github` section |
| API integration | Shared request handling and friendly error messages with Retry | `fetchJSON()`, `friendlyError()`, `showStatusError()` |
| Complex logic | Sort (Newest / Oldest / Title A–Z) combined with filter and search | `SORTERS`, `render()` in `initProjects()`; `#project-sort` |
| Complex logic | Level selector with a different message per level | `LEVELS`, `setLevel()`, `matches()`; `.filter-btn[data-level]`, `#level-message` |
| Complex logic | Visit timer that pauses while the tab is hidden | `initVisitTimer()`; `#visit-timer` in the footer |
| State management | Simulated login, then the visitor's name; greeting and contact form pre-fill; log out | `initLogin()`; `#login-button`, `#login-dialog`, `#greeting` |
| State management | Hide / Show on every section, remembered | `initSectionToggles()`; `[data-toggle]` buttons and `*-body` wrappers |
| State management | Category, level, sort and theme remembered | `storage` helper; keys listed in [What the site remembers](#what-the-site-remembers) |
| Performance | Lazy images with reserved size, `preconnect`, response caching, merged CSS, Lighthouse 100 | `createCard()`; `<head>` in `index.html`; [Performance](#performance) |

Features carried over from Assignments 1 and 2 (theme, contact form, scroll
spy, projects from data with filter and search, GitHub section, scroll reveal,
animations, reduced motion) are described below as well, with the parts that
changed in Assignment 3 called out.

## File structure

```
202366970-MohamedBukannan-assignment3/
├── index.html                       Single page: About, Projects, GitHub, Weather, Contact
├── css/
│   └── styles.css                   All styling, organised by component
├── js/
│   └── script.js                    All interactivity, one init function per feature
├── assets/
│   └── images/
│       └── project-placeholder.svg  Placeholder used by the project cards
├── docs/
│   ├── ai-usage-report.md           How AI tools were used
│   └── technical-documentation.md   This file
├── README.md
└── .gitignore
```

The split is by role rather than by feature: markup, styling and behaviour each
live in one file, with comment headers dividing each file into sections.

## HTML structure

| Element | Purpose |
|---|---|
| `<header class="site-header">` | Sticky bar: name, navigation, **Log in** and **Dark mode** buttons (in `.header-actions`) |
| `<nav class="nav">` | Anchor links to About, Projects, GitHub, Weather and Contact |
| `<dialog id="login-dialog">` | The simulated login window, with two forms: `#login-form` (step 1) and `#name-form` (step 2) |
| `<section id="about">` | Name, tagline, intro paragraph and the `#greeting` line shown after login |
| `<section id="projects">` | Two rows of filter buttons (category and level), search box, sort menu, level message, result count, the `#project-grid` filled by JavaScript, and the `#project-empty` box |
| `<section id="github">` | `#repo-status` for loading and error messages and the `#repo-list` filled by JavaScript |
| `<section id="weather">` | `#weather-status` for loading and error messages, the `#weather-card` filled by JavaScript, and the Open-Meteo credit |
| `<section id="contact">` | Contact form (front-end only) |
| `<footer class="site-footer">` | Copyright line and the `#visit-timer` line |

**Every section has the same shape.** The heading and its Hide/Show button sit
together in a `.section-head`, and everything else in the section is wrapped in
one element with an id ending in `-body` (`about-body`, `projects-body`, and so
on). The button names its target with `data-toggle="projects-body"`, so one
function handles every section.

**The project cards are not written in the HTML.** They live as data in
`js/script.js` and are built at load time, so filtering, searching and sorting
only decide *which* items to show and in what order. A `<noscript>` message
covers visitors with JavaScript turned off.

**States are driven by attributes.** The filter and level buttons use
`aria-pressed`, the Hide/Show buttons use `aria-expanded`, hidden parts use the
`hidden` attribute, and the status areas use `role="status"`. The same attribute
that styles a state also announces it to assistive technology, so the two
cannot drift apart.

**The login window is a native `<dialog>`.** Opened with `showModal()`, the
browser dims the page behind it, keeps keyboard focus inside it, and closes it
when Escape is pressed, with no extra code for any of that.

Two scripts are loaded: a small inline script in `<head>` that applies the
colour theme before the first paint (see [Theming](#theming)), and
`js/script.js` with `defer`, so it runs after the HTML is parsed without
blocking rendering. `<head>` also has two `preconnect` hints for the API hosts
(see [Performance](#performance)).

## CSS approach

**Design tokens.** All colours, the font stack, the corner radius, the shadow
and the maximum content width are custom properties on `:root`. Every rule,
including all the Assignment 3 components (level message, sort menu, login
dialog, greeting, Hide/Show buttons, weather card), uses `var(--...)`, so the
dark theme works for the new parts with no extra CSS.

**Shared rules instead of copies.** In Assignment 3 the three pill-shaped
buttons (the header buttons, the filter and level buttons, and the Hide/Show
buttons) were defined by three nearly identical blocks. They now share one rule,
and each only adds what is different:

```css
.theme-toggle,
.filter-btn,
.toggle-btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  /* ...shared look... */
}

.toggle-btn {            /* only what is different */
  flex-shrink: 0;
  margin-top: 0.5rem;
  padding: 0.35rem 0.85rem;
  font-size: 0.85rem;
}
```

In the same way, the login dialog's fields and buttons reuse the contact form's
rules (`.contact-form input, .dialog-form input { ... }`) instead of copying
them.

**One rule for `hidden`.** Several elements have a `display` value set by a
class (for example `display: flex`), which would beat the browser's default
styling for the `hidden` attribute. One global rule makes `hidden` always win:

```css
[hidden] {
  display: none !important;
}
```

**Layout.** Flexbox for one-dimensional rows (header, filter rows, search and
sort, tag lists, dialog buttons, weather card); CSS Grid for the two card grids
(`.project-grid` and `.repo-list`).

## Responsive design

Two `max-width` breakpoints, so desktop is the default and each query narrows
it:

| Width | Project grid and repo list | Header | Filter rows, search and sort |
|---|---|---|---|
| Above 768px | 3 columns | Row | Two button rows stacked on the left, search and sort on the right |
| 768px and below | 2 columns | Row | Same, the search box narrower |
| 480px and below | 1 column | Stacked; nav links wrap onto two centred lines | Search and sort move below the buttons and share one row |

The two button rows sit in a `.filter-rows` column, and search and sort sit
together in `.search-sort`. The controls bar uses `flex-wrap`, so on a narrow
screen `.search-sort` drops below the buttons instead of overflowing. The
search box has `min-width: 0`; without it a flex item will not shrink below its
content width, and on a phone it pushed the sort menu past the screen edge.

The navigation gained a fifth link (Weather) in Assignment 3, which made it
366px wide, too wide for a 320px phone. Below 480px the links now use
`flex-wrap: wrap` and `justify-content: center`, so they wrap onto a second,
centred line instead of making the page scroll sideways.

The weather card is a flex row with a maximum width of 480px, so it stays
compact on desktop and fills the width on a phone.

## Theming

**Mechanism.** The theme is a single attribute on the root element:
`<html data-theme="light">` or `data-theme="dark"`. The CSS defines the dark
values under `:root[data-theme="dark"]`, reusing the same token names.

**Choosing the starting theme.** On first visit the site follows the operating
system via `prefers-color-scheme`. Once the visitor clicks the toggle, their
explicit choice is stored in `localStorage` and takes priority from then on.

**Avoiding the flash.** The theme has to be set before the first paint, or a
visitor who chose dark mode sees the light theme flash while the page loads.
That is why a short script sits inline in `<head>` rather than in
`js/script.js`, which is deferred until after parsing:

```html
<script>
  (function () {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (error) {}
    var dark = saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  })();
</script>
```

The `try`/`catch` is deliberate: `localStorage` throws when storage is blocked,
for example in some private-browsing modes, and that must not stop the page
rendering.

**Contrast.** The light theme's teal (`#0f766e`) is too dark to read against a
dark background, so the dark theme lightens the accent to `#2dd4bf`. For the
same reason the submit button's text colour became a token
(`--color-on-accent`): white on light teal is unreadable, so the dark theme
switches that text to the dark background colour instead.

`color-scheme: dark` is also set, which tells the browser to draw its own
elements — scrollbars, focus rings, form-control internals — in dark mode
rather than leaving them light.

## JavaScript features

`js/script.js` is organised into small sections, each with one `init`
function, all called at the bottom of the file. Each `init` function starts by
looking up its own elements and returns early if they are missing, so a change
to the markup cannot crash the rest of the page.

| # | Section | Status |
|---|---|---|
| 0 | `storage` helper | New in A3 |
| 0b | `fetchJSON`, `friendlyError`, `showStatusError` | New in A3 |
| 1 | Theme toggle | A1, now uses `storage` |
| 2 | Contact form | A1 |
| 3 | Scroll spy | A1 |
| 4 | Projects: filter, level, search, sort | A2, level and sort new in A3 |
| 5 | Latest on GitHub | A2, now uses `fetchJSON` |
| 6 | Scroll reveal | A2 |
| 7 | Visit timer | New in A3 |
| 8 | Simulated login | New in A3 |
| 9 | Show / hide sections | New in A3 |
| 10 | Weather | New in A3 |

All text that comes from data — project fields, the visitor's name and,
especially, API responses — is inserted with `textContent`, never `innerHTML`,
so it is always displayed as text and can never run as HTML.

### 0. Storage helper (`storage`)

Every feature that remembers something goes through one small object:

```js
const storage = {
  get: function (key) {
    try { return localStorage.getItem(key); }
    catch (error) { return null; }
  },
  set: function (key, value) {
    try { localStorage.setItem(key, value); }
    catch (error) { /* ignored */ }
  },
  remove: function (key) { /* same pattern */ }
};
```

`localStorage` throws an error when storage is blocked, for example in some
private-browsing modes. Before Assignment 3 every feature wrapped its own reads
and writes in `try`/`catch`; now that is written once. A blocked read behaves
like "nothing saved yet" and a blocked write is skipped, so every feature keeps
working for the current visit.

### 0b. Fetch helper (`fetchJSON`)

Both API sections load data the same way, so the shared steps live in one
`async` function:

```js
const data = await fetchJSON(url, { cacheKey: 'weather', maxAgeMs: 15 * 60 * 1000 });
```

1. **Cache.** If `cacheKey` is given and `sessionStorage` holds a copy saved
   less than `maxAgeMs` ago, that copy is returned and no request is made.
   Each copy is stored as `{ savedAt, data }`.
2. **Timeout.** An `AbortController` is created and `setTimeout` aborts the
   request after `timeoutMs` (8 seconds by default), so a server that never
   answers ends in an error instead of "Loading…" forever.
3. **Status check.** `fetch` only rejects when no answer arrives at all, so
   `response.ok` is checked by hand. 403 and 429 become `'rate-limit'`, any
   other failure `'http-<status>'`.
4. **Save.** The parsed JSON is saved to `sessionStorage` with the current time
   and returned.

Failures are thrown as short codes (`'timeout'`, `'rate-limit'`, `'network'`,
`'http-404'`). `friendlyError(error, service, what)` turns a code into a
sentence, for example *"GitHub is limiting requests right now. Wait a minute,
then try again."*, and `showStatusError(status, message, retry)` puts that
sentence and a **Retry** button into a section's status area. Both API sections
use the same two functions, so errors look and behave the same everywhere.

`sessionStorage` is used rather than `localStorage` because the cache should
not outlive the browser tab: a visitor who comes back tomorrow gets fresh data.

### 1. Theme toggle (`initThemeToggle`)

The button in the header flips `data-theme` on `<html>`, saves the new value
with `storage.set('theme', ...)`, and updates its own `aria-pressed` attribute.
The starting theme is not recalculated here — it is read from the attribute the
inline script already set, so the logic exists in only one place.

### 2. Contact form validation (`initContactForm`)

The form has no backend. Without JavaScript a `<form>` with no `action`
submits to the current URL, so the browser reloads the page and appends the
field values to the address bar. `event.preventDefault()` in the submit handler
is what stops that.

The form carries `novalidate`. This switches off the browser's own validation
pop-ups but **not** its validation: the browser still checks every field, and
the script reads that result through the Constraint Validation API:

```js
if (field.validity.valueMissing) return labelFor(field) + ' is required.';
if (field.validity.typeMismatch) return 'Enter a valid email address, ...';
```

Keeping the browser's own checks means the site does not carry a hand-written
email pattern, which is a common source of false rejections, while the wording
and styling of the message stay under the site's control. The one rule the
browser cannot express, a minimum message length of 10 characters, is checked
in the script.

Behaviour on submit:

1. every field is checked, and each message is written into its own
   `<span class="field-error">`;
2. invalid fields get `aria-invalid="true"`, which is both the styling hook and
   the signal to screen readers;
3. focus moves to the first invalid field;
4. if everything passes, the status line reports the result and the form
   resets.

Per-field checking on blur only switches on **after** the first submit attempt.
Validating from page load would tell a visitor a field is empty before they
have reached it. Once a message is showing, it clears as soon as typing makes
the field valid again.

Because nothing is sent anywhere, the success message says so rather than
claiming the message was delivered, and it animates in on every submit (see
[Animations](#animations-and-reduced-motion)). In Assignment 3 the Name field is
filled in automatically after a visitor logs in (see
[Simulated login](#8-simulated-login-initlogin)).

### 3. Scroll spy (`initScrollSpy`)

`IntersectionObserver` reports when a section enters or leaves the viewport,
and the matching navigation link is given an `active` class:

```js
const observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) activate(linkFor.get(entry.target));
  });
}, { rootMargin: '-40% 0px -55% 0px' });
```

The `rootMargin` shrinks the region that counts as "on screen" to a band across
the middle of the viewport. Without it, a section would become active the
moment one pixel of it appeared at the bottom edge, and the highlight would
flicker between two links whenever both were partly visible.

The alternative approach — a `scroll` event listener that measures element
positions on every frame — runs hundreds of times a second on the main thread.
`IntersectionObserver` is handled by the browser and only calls back when a
threshold is actually crossed.

### 4. Projects: filter, level, search and sort (`initProjects`)

**Data.** Each project is an object in the `projects` array. Assignment 3 added
`level` and `date`:

```js
{
  title: 'TermFS',
  category: 'software',
  level: 'beginner',
  date: '2025-12',
  tags: ['Java', 'CLI', 'data structures', 'hash table', 'KMP'],
  image: 'assets/images/project-placeholder.svg',
  description: 'A terminal-based file system simulator ...'
}
```

The dates are the months each project was submitted (ICS 108 in May 2025,
ICS 202 in December 2025, COE 203 in May 2026). The levels follow my own
definitions:

| Level | Meaning | Project |
|---|---|---|
| Beginner | The basics of logic, without building a user interface | TermFS |
| Medium | A complete front end, with both logic and interface, but no back end | Classroom Reservation System |
| Hard | Low-level logic gates used to build complex logic | Digital Queue Management System |

**The four-step pipeline.** Every change goes through one function, which
builds the grid in the same order each time:

1. keep projects in the chosen **category** (All / Software / Hardware)
2. keep projects at the chosen **level** (Any / Beginner / Medium / Hard)
3. keep projects whose title or tags contain the **search** text
4. **sort** what is left (Newest / Oldest / Title A–Z)

```js
const visible = projects
  .filter(function (project) { return matches(project, query); })  // steps 1-3
  .sort(SORTERS[activeSort]);                                      // step 4
```

`matches()` returns `false` as soon as one test fails. `filter()` returns a new
array, so sorting it never changes the order of the original `projects` list.

**Sorting.** `SORTERS` maps each menu option to a compare function:

```js
const SORTERS = {
  newest: function (a, b) { return b.date.localeCompare(a.date); },
  oldest: function (a, b) { return a.date.localeCompare(b.date); },
  title:  function (a, b) { return a.title.localeCompare(b.title); }
};
```

Dates are stored as `'YYYY-MM'` text. Because the year comes first and the
month always has two digits, comparing them as text gives the same order as
comparing them as dates, so no date parsing is needed. Swapping `a` and `b`
reverses the order. The full month is kept (not just the year) because two
projects are from 2025; with the year alone, Newest first could not tell them
apart.

**Levels and messages.** `LEVELS` holds, for each level, the label shown on the
cards and the message shown above the grid:

```js
const LEVELS = {
  beginner: { label: 'Beginner', message: 'Beginner projects: where I learned the basics of logic, ...' },
  medium:   { label: 'Medium',   message: 'Medium projects: where I learned to build a complete front end, ...' },
  hard:     { label: 'Hard',     message: 'Hard projects: where I learned to work with low-level logic gates, ...' }
};
```

`render()` shows the message for the chosen level in `#level-message` and hides
it for Any level. Each card shows its level and month, for example
"Hard · May 2026", produced by `formatMonth()`.

**Two button rows.** The category and level buttons share the `.filter-btn`
style, so they are told apart by attribute: `[data-filter]` for category and
`[data-level]` for level. Without that, the category code would also pick up
the level buttons.

**Remembered choices.** Category, level and sort are saved under
`projectFilter`, `projectLevel` and `projectSort`. On load each saved value is
applied only if it is still a real option (a button with that value exists, or
the key exists in `LEVELS` / `SORTERS`), so an old or hand-edited value falls
back to the default instead of breaking the page.

**Empty state.** When nothing matches, `#project-empty` explains why: with
search text, `No projects match "…".` with a Clear search button; without it,
"No projects match this category and level yet.", for example Hard + Software.

**Building a card.** `createCard(project, index)` creates the `<article>`,
image, heading, level-and-date line, description and tag list, fills them with
`textContent`, and staggers the fade-in by `index`. The image gets
`width`/`height`, `loading="lazy"` and `decoding="async"` (see
[Performance](#performance)).

### 5. Latest on GitHub (`initGitHubRepos`)

**The request.**

```js
const url = 'https://api.github.com/users/MJBukannan/repos?sort=updated&per_page=100';
```

The public GitHub REST API needs no key. `sort=updated` returns the most
recently changed repositories first.

**`loadRepos()`.**

1. Shows "Loading repositories…" and empties the list.
2. Calls `fetchJSON(url, { cacheKey: 'githubRepos', maxAgeMs: 10 minutes })`.
   GitHub allows only 60 unauthenticated requests an hour per IP address, so a
   reload within 10 minutes reuses the saved answer.
3. Removes forks (other people's projects) and keeps the first six
   (`REPO_LIMIT`).
4. Shows "No public repositories yet." if nothing is left; otherwise replaces
   the list with repo cards (name linking to GitHub, description, language,
   last-updated date).
5. On any error, calls `showStatusError()` with the message from
   `friendlyError()`. Retry calls `loadRepos()` again.

In Assignment 2 this section had its own loading and error functions; they were
replaced by the shared helpers, which also added the cache and the timeout.

Links open in a new tab with `rel="noopener"`, which stops the new tab from
getting a reference back to this page.

### 6. Scroll reveal (`initScrollReveal`)

Each `.section` gets the class `reveal`, which in CSS means "transparent and
24px lower". An `IntersectionObserver` with `threshold: 0.15` watches every
section; when 15% of one is on screen it adds `is-visible`, and a 0.6s CSS
transition moves it into place. The section is then unobserved, so it animates
once and does not repeat when scrolling back up.

The hidden starting state is added by JavaScript, not written in the HTML. If
JavaScript is off, `IntersectionObserver` is unsupported, or the visitor prefers
reduced motion, the function returns before adding `reveal`, and every section
is simply visible.

### Smooth scrolling

Smooth scrolling is still one CSS declaration (`html { scroll-behavior: smooth; }`)
rather than JavaScript. It is turned off under reduced motion.

### 7. Visit timer (`initVisitTimer`)

The footer shows how long the visitor has had the page open, updated every
second:

| Time on page | Shown as |
|---|---|
| Under a minute | `42s` |
| Under an hour | `2m 13s` |
| An hour or more | `1h 2m 34s` |

The timer only counts while the tab is **visible**. It keeps two numbers:
`countedMs` (time from earlier visible stretches) and `startedAt` (when the
current stretch began). The Page Visibility API drives it:

```js
document.addEventListener('visibilitychange', function () {
  if (document.hidden && intervalId !== null) {
    pause();   // countedMs += performance.now() - startedAt; stop the interval
  } else if (!document.hidden && intervalId === null) {
    start();   // startedAt = performance.now(); start the interval
  }
});
```

Time is measured with `performance.now()`, not by counting interval ticks.
Browsers slow down `setInterval` in background tabs, so a tick counter would
drift; reading the clock each second is always accurate. If the page loads in a
background tab, counting only starts once it is first seen. The timer is not
saved: it measures the current visit.

### 8. Simulated login (`initLogin`)

The page has two states, logged out and logged in, saved under `loggedIn` and
`visitorName`.

**Logging in takes two steps inside the dialog:**

1. **Username and password.** Both must be filled in; each empty field gets its
   own message ("Username is required." / "Password is required.") and
   `aria-invalid`. Any non-empty values are accepted, because there is no
   server to check them against, and the dialog says so. On success,
   `loggedIn` is saved and the username is saved as the name for now.
2. **"What should I call you?"** The name box starts filled with the username.
   On Save the name is trimmed, repeated spaces are collapsed, it is cut to 40
   characters, and it is saved. An empty name shows "Please enter a name."

The username is saved as the name in step 1 on purpose: if the visitor presses
Escape or Cancel during step 2, they are still logged in and are greeted by
their username, instead of being stuck logged in with no name.

**Updating the page.** `render()` makes the page match the saved state:

- logged in: the header button reads **Log out**, the About section shows
  "Welcome back, *name*!", and the contact form's Name field is filled in if
  the visitor has not typed in it;
- logged out: the button reads **Log in** and the greeting is hidden.

`render()` runs on load and on the dialog's `close` event. That event fires
however the dialog closes (Save, Cancel or Escape), so there is one place that
updates the page instead of three.

**Logging out** removes both keys, clears the contact form's Name field if it
still holds the saved name, and calls `render()`.

### 9. Show / hide sections (`initSectionToggles`)

Every button with a `data-toggle` attribute hides or shows the element whose
id it names. The ids of hidden parts are kept as a list and saved as JSON:

```js
hiddenIds = hiddenIds.includes(id)
  ? hiddenIds.filter(function (item) { return item !== id; })  // was hidden: show it
  : hiddenIds.concat(id);                                       // was shown: hide it

storage.set('hiddenSections', JSON.stringify(hiddenIds));
```

`apply(button)` then sets the target's `hidden` attribute, changes the button
text to **Show** or **Hide**, and updates `aria-expanded`. On load the saved
list is read back with `JSON.parse` inside `try`/`catch`; a missing or broken
value simply means nothing is hidden. Because the function only reads
`data-toggle`, adding a Hide button to a new section needs no JavaScript.

### 10. Weather (`initWeather`)

**The request.** Open-Meteo is free and needs no API key or account, so the
section also works for anyone grading the site.

```js
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'
  + '?latitude=26.31&longitude=50.14'
  + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code'
  + '&timezone=Asia%2FRiyadh';
```

The coordinates are KFUPM in Dhahran; `current=` asks only for the five values
the card shows, which keeps the response small.

**`loadWeather()`.**

1. Hides the card and shows "Loading weather…".
2. Calls `fetchJSON` with a 15-minute cache (weather changes slowly).
3. Checks the answer actually contains a numeric `temperature_2m`, in case the
   API ever changes shape; if not, it is treated as an error.
4. Fills each `[data-weather="…"]` element: rounded temperature, conditions,
   feels-like, humidity, wind, and the update time (the `HH:MM` part of
   `current.time`).
5. On any error, shows the friendly message with Retry, the same way as the
   GitHub section.

**Turning the weather code into words.** Open-Meteo describes the sky with a
WMO code (0 = clear, 2 = partly cloudy, 61 = rain, …). The codes come in
ranges, so `WEATHER_CODES` lists the highest code of each range, and
`describeWeather()` returns the first entry the code fits under:

```js
const WEATHER_CODES = [[0, 'Clear sky'], [3, 'Partly cloudy'], [48, 'Foggy'], /* ... */ [99, 'Thunderstorm']];
```

The section credits Open-Meteo with a link, as its terms ask.

## What the site remembers

| Key | Storage | Value | Set by |
|---|---|---|---|
| `theme` | localStorage | `light` / `dark` | Theme toggle |
| `projectFilter` | localStorage | `all` / `software` / `hardware` | Category buttons |
| `projectLevel` | localStorage | `all` / `beginner` / `medium` / `hard` | Level buttons |
| `projectSort` | localStorage | `newest` / `oldest` / `title` | Sort menu |
| `loggedIn` | localStorage | `true` (absent when logged out) | Login |
| `visitorName` | localStorage | the visitor's name | Login, step 2 |
| `hiddenSections` | localStorage | JSON list of hidden `*-body` ids | Hide / Show buttons |
| `githubRepos` | sessionStorage | `{ savedAt, data }`, reused for 10 minutes | `fetchJSON` |
| `weather` | sessionStorage | `{ savedAt, data }`, reused for 15 minutes | `fetchJSON` |

Nothing is sent to any server: the login, the name and every choice stay in the
visitor's own browser.

## Animations and reduced motion

All animations use only `opacity` and `transform`, which browsers can animate
without recalculating layout.

**One shared keyframe.**

```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}
```

**Cards.** `.project-card` and `.repo-card` play `fade-up` over 0.35s. Because
`render()` rebuilds the cards on every filter or search, the animation replays
each time. `createCard` sets `animationDelay` to `index × 60ms`, so cards appear
one after another.

The fill mode is `backwards`, not `both`. A running or filled animation
overrides normal styles, which would cancel the card's hover lift
(`transform: translateY(-4px)`). `backwards` only applies the starting frame
during the stagger delay, then releases the card when the animation ends, so
hover still works.

**Form message.** `.form-status.success` plays `fade-up`. A CSS animation only
starts when its class is added, so on a second successful submit the class
would already be present and nothing would move. `setStatus()` therefore
removes the class, reads `status.offsetWidth` (which forces the browser to apply
that change immediately), and then adds the class again, so the message animates
on every submit.

**Empty state and weather card.** The empty-search box and the weather card
also fade up when they appear.

**Reduced motion.** Visitors who turn on *Reduce motion* (macOS: System Settings
→ Accessibility → Display; iOS: Settings → Accessibility → Motion) get every
change instantly:

- JavaScript: `prefersReducedMotion` uses
  `window.matchMedia('(prefers-reduced-motion: reduce)')`, and the scroll reveal
  does not run at all.
- CSS: inside `@media (prefers-reduced-motion: reduce)`, animation and
  transition durations are cut to effectively zero, delays are removed, and
  smooth scrolling is switched off. Content still updates; it just does not
  move.

This is not required by the assignment, but animation can cause discomfort for
some people, and supporting the system setting costs about ten lines.

## Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `section`, `article`, `footer`.
- Filter and level buttons are real `<button>`s in `role="group"` containers
  with an `aria-label`, and announce their selected state through
  `aria-pressed`.
- Hide/Show buttons use `aria-expanded` and `aria-controls`, so a screen reader
  knows what they open and whether it is open.
- The search box and sort menu have `<label>`s that are hidden visually
  (`.visually-hidden`) but still read by screen readers.
- The login window is a native `<dialog>` opened with `showModal()`: focus
  moves into it, stays inside while it is open, Escape closes it, and focus
  returns to the Log in button afterwards. Its fields have labels, and errors
  are tied to them with `aria-describedby` and `aria-invalid`.
- The result count uses `aria-live="polite"`, and the GitHub and weather
  messages appear in `role="status"` regions, so changes are announced without
  interrupting.
- Retry and Clear search are focusable buttons; Clear search returns focus to
  the search box.
- Reduced-motion support, described above.
- Carried over from Assignment 1: labelled contact form fields with errors tied
  by `aria-describedby`, an active nav link marked by more than colour, visible
  focus, and dark-theme colours adjusted for contrast.

Lighthouse Accessibility score: **100** (mobile and desktop).

## Performance

**Lighthouse results** (Chrome, Incognito window so browser extensions cannot
affect the result, page served locally with `python3 -m http.server`):

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile | 100 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

A first run in a normal Chrome window scored 41 for Performance, with 4 seconds
of Total Blocking Time. The site's own script does very little on load, so the
blocking time came from Chrome extensions injecting their own scripts into the
page; the same code scored 99 in a clean headless run and 100 in Incognito.

**What was done for Assignment 3**

- **Lazy images with reserved space.** Project images are created with
  `loading="lazy"` (off-screen images load only when scrolled near),
  `decoding="async"`, and `width="600" height="340"`, so the browser reserves
  their space before they arrive and nothing jumps (Cumulative Layout Shift: 0).
  The CSS keeps `height: auto` next to `aspect-ratio: 16 / 9`; without it the
  `height` attribute overrode the aspect ratio and stretched the images.
- **Early connections.** `<link rel="preconnect">` for `api.github.com` and
  `api.open-meteo.com` lets the browser open both connections while the page is
  still loading.
- **Fewer requests.** API answers are cached in `sessionStorage` (10 and 15
  minutes), so reloading the page makes no new API calls.
- **No repeated code.** The `storage` and `fetchJSON` helpers replaced repeated
  `try`/`catch` blocks and two separate copies of the loading/error logic, and
  three near-identical CSS button rules were merged into one.
- **Unused code removed.** Every class in `styles.css` was checked against the
  HTML and JavaScript, and every function and constant in `script.js` against
  where it is used; none were unused. The empty `assets/images/.gitkeep` was
  removed because the folder now holds a real file.
- **Images.** The only image is a 273-byte SVG placeholder, so there was
  nothing to compress or resize.

**Carried over:** no dependencies, no build step and no web fonts; `defer` on
the script; only `opacity` and `transform` animated; `IntersectionObserver`
instead of scroll listeners; small DOM rebuilds with one `replaceChildren` call.

**Lighthouse suggestions left on purpose**

| Suggestion | Why it was left |
|---|---|
| Use efficient cache lifetimes / enable text compression | These are set by the web server, not the page. Python's test server does neither; GitHub Pages, where the site is published, sends compressed files with cache headers. |
| Minify CSS and JavaScript (about 24 KiB) | Minifying removes the comments and formatting that make the code readable and explain how it works, which matters more for this project than 24 KiB. |
| Render-blocking requests (40–270 ms) | The stylesheet has to load before the page can be drawn; that is expected for any styled page, and it did not lower the score. |
| Avoid non-composited animations (2 elements) | Informational only; it does not affect the score. |

## Browser and device testing

**Automated (Chromium, Playwright).** The page was served locally and driven by
scripts, with both APIs mocked so each state could be forced.

| Check | Result |
|---|---|
| Sort: Newest / Oldest / Title A–Z | Digital Queue → TermFS → Classroom Reservation, the reverse, and alphabetical |
| Filter + search + sort together | Software + "java" + Oldest gives Classroom Reservation, then TermFS ("Showing 2 of 3") |
| Level buttons | Beginner, Medium and Hard each show one project and their own message; Any level shows all three with no message |
| Hard + Software | Empty state: "No projects match this category and level yet." |
| Category, level and sort remembered | Still selected after a reload; an invalid saved value falls back to the default |
| Visit timer | Counts seconds; 3 seconds with the tab hidden were not counted; one hour shows as `1h 2m …` |
| Login with empty fields | "Username is required." and "Password is required." |
| Login, then name | Step 2 pre-filled with the username; empty name rejected; after Save: Log out button, greeting, contact Name filled |
| Login after reload | Still logged in and greeted |
| Escape during step 2 | Logged in, greeted by the username |
| Log out | Greeting hidden, contact Name cleared, both keys removed |
| Hide About and GitHub, reload | Both still hidden, buttons read Show with `aria-expanded="false"` |
| Weather success | Temperature, conditions, feels-like, humidity, wind and time shown |
| Cache | After a reload, each API had been called only once |
| GitHub 403 | Rate-limit message with Retry |
| Weather offline | Connection message with Retry; Retry sends a new request |
| Weather never answers | After 8 seconds: "The weather service took too long to answer" with Retry |
| Project images | 16:9 at every width (327×184 desktop, 356×200 phone), `loading="lazy"` |
| Merged button CSS | Computed styles of every pill button identical before and after |
| Dark mode | Login dialog, greeting, level message and weather card all readable |
| 320px, 360px, 390px, 480px and 768px widths | No horizontal scrolling; below 480px the five nav links wrap onto two centred lines, and jumping to a section still leaves its heading below the sticky header |
| Console | No errors |

**Manual.** Tested by hand in both Chrome and Safari on macOS: every feature above, at desktop
and narrow window widths, with Lighthouse run on mobile and desktop.

## Known limitations

- **The login is simulated.** Any username and password are accepted and
  nothing is checked or sent; it demonstrates state, not security. A real login
  would need a backend.
- **The contact form cannot deliver a message.** A backend or hosted form
  service would be the next step.
- **Both live sections depend on outside services.** If GitHub or Open-Meteo is
  down, the visitor sees the error message and Retry, but no data. GitHub's
  limit of 60 requests an hour per IP address is reduced, not removed, by the
  10-minute cache.
- **Saved choices belong to one browser.** Everything is in `localStorage`, so
  it does not follow the visitor to another browser or device, and clearing site
  data resets it.
- **The visit timer is not saved**; it restarts on every page load by design.
- **Only six repositories** are shown, and only the first 100 returned by the
  API are considered.
- **Project data lives in `script.js`.** Moving it to a separate JSON file would
  separate content from code, but would need a local server to load, since
  `fetch` of a local file is blocked over `file://`.
- **The project cards share one placeholder image**, which stays light in dark
  mode because an external SVG cannot read the page's CSS variables.
