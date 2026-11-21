# AI Usage Report

SWE 363 — Assignment 3: Advanced Functionality · Mohamed AlJawad Bukannan (202366970)

## Tools Used & Use Cases

I used one AI tool for this assignment: **Claude (Opus 5.5, Anthropic)**, in
one long conversation over two days (November 20–21, 2026). Claude could read
my course folder and my repository, run commands in the repository, and test the
site in a headless browser. I used it for:

- **Planning.** Finding which assignment was due, reading the Assignment 3
  guideline against my Assignment 2 site, and listing which requirements still
  needed new work. It also synced my course notes with the course repository and
  kept a requirements-and-plan note in my notes vault up to date.
- **Code generation.** Writing each feature after I had approved its plan.
- **Explanation.** Explaining what changed in each file and how the code works
  (for example, how a sort compare function works, and why the timer uses
  `performance.now()`), and explaining tools I had not used before, such as
  Lighthouse.
- **Testing and debugging.** Running each feature in a headless browser with the
  APIs mocked to force success, error and timeout states, and checking several
  screen widths. This found bugs that I then had fixed (see below).
- **Documentation support.** Drafting the README, the technical documentation
  and this report, which I then reviewed and edited.
- **Git.** Making the commits (each with an `Assisted-by` line) once I had
  checked the feature and said so.

## Benefits & Challenges

**Benefits**

- **Working in small, checkable steps.** For every feature I asked Claude to
  tell me the requirement first, then the plan. I would critique the plan and
  add my input, and Claude wrote code only after I confirmed. That made each
  change small enough to read and test before it was committed, and gave the
  repository one clear commit per feature.
- **Testing I would not have done by hand.** The automated runs forced cases
  that are hard to produce manually: GitHub refusing requests, the weather API
  never answering, a 320px-wide phone, a saved setting with an invalid value.
- **Faster explanations.** When I did not understand something, such as what a
  piece of CSS did or why my first Lighthouse score was low, I got a focused
  explanation instead of searching through documentation.

**Challenges**

- **The AI did too much at once at first.** Its first answer built every
  feature in one go before I had agreed to any of them. I could not review that
  properly, so I had the folder reset to my Assignment 2 code and rebuilt the
  features one at a time. This allowed me to be in the loop while developing my
  code, and not have the AI do everything instead of me.
- **It filled in facts about me with guesses.** It first guessed the dates and
  levels of my projects. I asked it to check the real information in my files,
  and it found the submission dates in my term folders; I defined the levels
  myself.
- **Its code had bugs that only testing showed.** One edit put the level check
  inside the category check, so the level filter never ran; the image size
  change stretched the project images; the empty-search message no longer made
  sense with two filters; and the new Weather link made the page scroll sideways
  on 320px phones. Each was caught by testing and fixed before committing.
- **Results needed interpreting.** My first Lighthouse run gave 41 for
  Performance. It turned out to be caused by my Chrome extensions, not the site;
  in an Incognito window it scored 100.

## Learning Outcomes

- **Combining several filters with a sort.** Building the grid as a pipeline
  (category, then level, then search, then sort) with `filter()` and `sort()`,
  and how a compare function decides the order. I also learned that dates
  written as `'YYYY-MM'` sort correctly as plain text, and why we kept the month
  (two of my projects are from 2025).
- **Selecting by data attributes.** Telling the category and level buttons
  apart with `[data-filter]` and `[data-level]` even though they share a class.
- **State in the browser.** The difference between `localStorage` (kept
  between visits) and `sessionStorage` (kept for the tab), saving a list as
  JSON, and checking a saved value before trusting it.
- **Timing.** Using the `visibilitychange` event to pause the timer, and
  measuring time with `performance.now()` because browsers slow down timers in
  background tabs.
- **Requests.** Using `AbortController` to give up on a slow request, checking
  `response.ok` because `fetch` does not fail on HTTP errors, and caching API
  answers so reloads do not use up GitHub's rate limit.
- **The native `<dialog>` element**, which handles focus, the dimmed background
  and the Escape key without extra code.
- **CSS details.** Why a flex item needs `min-width: 0` to shrink, why an
  image's `height` attribute needs `height: auto` in the CSS to keep its aspect
  ratio, and merging repeated rules into one shared rule.
- **Lighthouse.** What its four scores measure, and that extensions can distort
  the result, so it should be run in Incognito.
- **Workflow.** Asking for the requirement and the plan before any code is
  written, and testing before committing, is a better way to work with AI than
  letting it build everything at once.

## Responsible Use & Modifications

I did not hand in AI output without checking it and adding my own changes and
fixes when appropriate. For every feature I critiqued and approved the plan,
Claude explained each change, I went over the code, ran the site and tried the
feature myself, added any necessary fixes, and only then asked for the commit.
The decisions about what to build were mine, and I changed or corrected the
AI's suggestions where they did not fit:

- **Reset the first draft** so each feature was rebuilt and reviewed separately.
- **Chose the features.** I picked the three complex-logic features; replaced
  the suggested name box with a **simulated login that then asks for the
  name** (one of the guideline's own examples); added Hide/Show to **every**
  section, not only GitHub; and kept both the new weather API and the GitHub
  upgrades.
- **Defined the project levels myself.** Claude suggested Beginner and Advanced
  with my Java project as Advanced. I defined three levels with my own
  meanings — Beginner (logic without a user interface), Medium (a full front end
  without a back end) and Hard (low-level logic gates) — which moved TermFS to
  Beginner, and I wrote the three messages.
- **Used real data.** The project dates come from my actual submission files.
  I also considered showing only the year, and decided to keep the month after
  seeing that two projects share a year.
- **Changed the layout and details.** I asked for the two filter rows to be
  stacked, the weather section to sit above the contact form, the timer to show
  hours as `1h 2m 34s`, and decided the login accepts any non-empty details and
  that logging out forgets the name.
- **Asked for explanations** of every change in the CSS and JavaScript before
  approving commits.
- **Tested it myself** in Chrome and Safari, ran Lighthouse on mobile and
  desktop, and corrected the technical documentation's testing section after
  testing in Safari.

Every AI-assisted commit ends with `Assisted-by: Claude Opus 5.5 (Anthropic)`.
The full conversation and the AI's intermediate output are in the AI Evidence
ZIP submitted on Blackboard.

## Usage Log

| ID | Tool (model) | Date | Purpose | Files affected | What you changed and how you verified it |
|----|--------------|------|---------|----------------|------------------------------------------|
| C01 | Claude Opus 5.5 (Anthropic) | 2026-11-20 to 2026-11-21 | Planned the assignment against the guideline; wrote every Assignment 3 feature one at a time after I approved each plan (storage helper, sort, level selector, visit timer, simulated login, show/hide sections, shared fetch helper with cache and timeout, weather API, performance changes, small-screen nav fix); explained each change; tested in a headless browser; explained Lighthouse and diagnosed my first low score; drafted the README, technical documentation and this report; made the commits | `index.html`, `js/script.js`, `css/styles.css`, `README.md`, `docs/technical-documentation.md`, `docs/ai-usage-report.md`; removed `assets/images/.gitkeep` | Reset the all-at-once first draft and rebuilt feature by feature; defined the Beginner/Medium/Hard levels and wrote their messages; chose the login-then-name flow, Hide/Show on every section, weather above Contact, stacked filter rows and the hour format; kept month dates from my real submission files. Verified each feature by reading the code myself and running it in both Chrome and Safari before its commit; ran Lighthouse in Incognito (100 in all four categories on mobile and desktop), and reviewed the documentation |
| A01 | Claude Opus 5.5 (Anthropic) | 2026-11-20 to 2026-11-21 | Code: the AI's first draft that built every feature at once, and the final code | `index.html`, `js/script.js`, `css/styles.css` | Did not accept the all-at-once draft: had the folder reset to my Assignment 2 code and every feature rebuilt one at a time, with my changes to each plan (the login-then-name flow, my three levels and their messages, Hide/Show on every section, stacked filter rows, the hour format, weather above Contact). The final version is the code as submitted. Verified each feature in Chrome and Safari before its commit |
| A02 | Claude Opus 5.5 (Anthropic) | 2026-11-21 | README: the AI's draft and the final version | `README.md` | Reviewed it against the site; once I had tested the site in Safari, I had Safari added to the browser support section |
| A03 | Claude Opus 5.5 (Anthropic) | 2026-11-21 | Technical documentation: the AI's draft and the final version | `docs/technical-documentation.md` | Changed the manual testing section to include Safari after testing it myself; checked the requirement map and feature descriptions against the code |
| A04 | Claude Opus 5.5 (Anthropic) | 2026-11-21 | This report: the AI's draft and the final version | `docs/ai-usage-report.md` | Rewrote parts in my own words to describe how I worked: critiquing each plan and adding my input before any code was written, staying in the loop instead of letting the AI do everything, and reviewing the code myself before each commit |

## Declaration

> I declare that this report and the attached evidence document all of my AI use in this assignment, with complete and unedited conversations, and that I understand and can explain all the code I submitted. I understand that undeclared AI use or a false declaration will be treated as plagiarism according to KFUPM regulations.

Name: Mohamed AlJawad Bukannan
Student ID: 202366970
Date: November 21, 2026
