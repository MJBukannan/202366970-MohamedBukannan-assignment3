# Personal Portfolio (Assignment 3) — Mohamed AlJawad Bukannan

A responsive personal portfolio website built for **SWE 363: Web Engineering and
Development** (Assignment 3: Advanced Functionality, Term 261, KFUPM).

Assignment 3 builds on the Assignment 1 and 2 site and adds more advanced
behaviour: projects can be filtered by category and level, searched and sorted
all at once; visitors can log in (simulated) and be greeted by name; every
section can be hidden and stays hidden on the next visit; a second live API
shows the current weather at KFUPM; and the page was tuned until Lighthouse
scored 100 in every category for both desktop and phone.

It is still a single static page written in plain HTML, CSS and JavaScript, with
no framework, no build step and no backend.

## Live demo

<https://mjbukannan.github.io/202366970-MohamedBukannan-assignment3/>

## What's new in Assignment 3

| Requirement | Feature |
|---|---|
| API integration | **Right now at KFUPM**: live weather in Dhahran (temperature, conditions, feels-like, humidity, wind) from the **Open-Meteo API**, which needs no key. Both APIs (weather and GitHub) now share one fetch helper that **gives up after 8 seconds** instead of loading forever and **caches** answers for the session, so reloading does not use up GitHub's 60-requests-an-hour limit. Every failure shows a friendly message with a **Retry** button. |
| Complex logic | **Sort** projects (Newest / Oldest / Title A–Z) on top of the category filter and search. **Level selector** (Beginner / Medium / Hard) that shows only that level's projects and a **different message** for each level. The grid is built in four steps every time: category → level → search → sort. **Visit timer** in the footer (`42s`, `2m 13s`, `1h 2m 34s`) that **pauses while the tab is hidden**. |
| State management | **Simulated login**: log in with any username and password, then the site asks *"What should I call you?"*, greets you by name in the About section and fills in the contact form. The login and name survive a reload; **Log out** clears both. **Hide / Show** buttons on every section, remembered between visits. The chosen category, level and sort are remembered too. |
| Performance | Project images load **lazily** with their size reserved (no layout jump), the browser **connects to both APIs early** (`preconnect`), repeated CSS was merged and unused files removed. **Lighthouse: 100 / 100 / 100 / 100** (Performance, Accessibility, Best Practices, SEO) on both mobile and desktop. |

## Features carried over from Assignments 1 and 2

- **Responsive layout** — three-column grids on desktop, two on tablet, one on
  mobile, built with CSS Grid and Flexbox.
- **Light and dark theme** — follows the operating system on first visit and
  remembers an explicit choice, applied before the page paints.
- **Projects from data** — cards built from a JavaScript array, with
  All / Software / Hardware filters, live search and a "Showing X of Y" count.
- **Latest on GitHub** — my public repositories, loaded live from the GitHub API.
- **Contact form validation** — inline, per-field messages. The form is
  front-end only and says so.
- **Scroll spy, scroll reveal and card animations**, all switched off for
  visitors who have turned on **Reduce motion**.

## Tech stack

| Layer | Technology |
|---|---|
| Markup | HTML5, semantic elements, native `<dialog>` for the login window |
| Styling | CSS3 — custom properties, Flexbox, Grid, keyframe animations, media queries |
| Behaviour | Vanilla JavaScript (ES2017: `fetch`, `async`/`await`, `AbortController`), no libraries |
| Data | GitHub REST API and Open-Meteo API (both public, no key needed); `localStorage` and `sessionStorage` |
| Tooling | Git and GitHub, Lighthouse |

No dependencies, no package manager, no build step.

## Project structure

```
.
├── index.html                       Single page: About, Projects, GitHub, Weather, Contact
├── css/
│   └── styles.css                   All styling, including animations
├── js/
│   └── script.js                    All interactivity (see the technical documentation)
├── assets/
│   └── images/
│       └── project-placeholder.svg
├── docs/
│   ├── ai-usage-report.md           How AI tools were used
│   └── technical-documentation.md   How every feature works
├── README.md
└── .gitignore
```

## Running it locally

Clone the repository:

```bash
git clone https://github.com/MJBukannan/202366970-MohamedBukannan-assignment3.git
cd 202366970-MohamedBukannan-assignment3
```

**Option 1 — serve it locally (recommended).** Any static server works. With
Python, which is already installed on macOS and most Linux systems:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

In VS Code, the **Live Server** extension does the same thing: right-click
`index.html` and choose *Open with Live Server*.

**Option 2 — open the file directly.** Double-click `index.html`. Everything
works, but some browsers block `localStorage` for pages opened over `file://`,
so saved choices (theme, login, hidden sections) may not be remembered between
visits.

There is nothing to install and nothing to build. The GitHub and weather
sections need an internet connection; without one they show an error message
with a Retry button.

## Using the site

- **Log in** with the button in the header. Any username and password work
  (nothing is sent anywhere). Then enter the name you want to be greeted by.
  **Log out** forgets both.
- **Filter projects** by category (All / Software / Hardware) and by level
  (Any level / Beginner / Medium / Hard). Each level shows its own message.
- **Search** by title or tag (for example `java`, `verilog` or `fpga`), and
  **sort** with the menu next to the search box. All of these work together and
  are remembered next time.
- **Hide** any section with the button next to its heading; it stays hidden
  until you press **Show**.
- **Latest on GitHub** and **Right now at KFUPM** load by themselves. If either
  fails, press **Retry**.
- **Theme** — use the Dark mode button in the header.
- The footer shows **how long you have been on the page**.

## Browser support

Tested by hand in **Chrome** on macOS, and with automated Playwright runs in
Chromium at desktop, tablet and phone widths, with both APIs mocked to force the
success, offline, rate-limit, timeout and retry states. Lighthouse was run in a
Chrome Incognito window (so extensions could not affect the result).
<!-- TODO: add Safari once tested by hand -->

The features used — `fetch`, `async`/`await`, `AbortController`, `<dialog>`,
`IntersectionObserver`, the Page Visibility API, CSS custom properties and Web
Storage — are supported in current versions of Chrome, Edge, Safari (15.4+) and
Firefox.

Details are in the
[technical documentation](docs/technical-documentation.md).

## AI usage

AI assistance (Claude) was used to plan the assignment against the guideline,
to help in writeing each new feature, to explain every change, and to test the features in
a headless browser. I worked through it one feature at a time: for each one I
asked for the requirement and the suggested plan first, decided what to build and critiqued the plan, checked the
code added and output in the browser, and only then had it committed.

My own decisions shaped the result. For example, I reset an all-at-once first
draft so each feature could be rebuilt and reviewed separately, defined the
three project levels myself (Beginner, Medium, Hard) and wrote their messages,
asked for the simulated login to lead into the name step, chose to add Hide/Show
to every section, set the timer's hour format, placed the weather section above
the contact form, and stacked the filter rows.

The full account is in [`docs/ai-usage-report.md`](docs/ai-usage-report.md).

## Documentation

- [Technical documentation](docs/technical-documentation.md) — file structure,
  how each feature works, accessibility, performance, testing and known
  limitations
- [AI usage report](docs/ai-usage-report.md)

## Author

**Mohamed AlJawad Bukannan** — Computer Science, King Fahd University of
Petroleum and Minerals
Student ID 202366970 · SWE 363, Section 01, Term 261
