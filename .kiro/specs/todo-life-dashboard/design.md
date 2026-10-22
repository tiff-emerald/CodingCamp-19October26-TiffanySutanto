# Design Document

## Overview

The To-Do Life Dashboard is a client-side single-page application (SPA) built with plain HTML, CSS, and vanilla JavaScript. It runs entirely in the browser with no build step, no package manager, and no backend server. All user data persists in the browser's `localStorage` API.

The dashboard is composed of four interactive panels arranged on a single page:

1. **Greeting Panel** – live clock, date, and time-based (or personalised) greeting
2. **Focus Timer** – Pomodoro-style countdown with Start / Stop / Reset controls
3. **To-Do List** – full task lifecycle: add, edit, complete, delete, with duplicate detection
4. **Quick Links** – saved website shortcuts that open in a new tab

Optional enhancements included in scope:
- **Light / Dark Theme toggle** (Challenge A) – persisted to `localStorage`
- **Custom Name in Greeting** (Challenge B) – personalised greeting stored in `localStorage`
- **Duplicate Task Prevention** (Challenge D) – case-insensitive, trim-aware uniqueness check

### Goals

- Zero external dependencies — works offline via `file://` or a local HTTP server.
- All four panels are visible and usable without scrolling on a 1280 × 800 viewport.
- Data integrity is preserved across page reloads through structured `localStorage` serialisation.

---

## Architecture

The project follows a **three-file architecture** enforced by Requirement 8:

```
project-root/
├── index.html          ← single HTML file; contains all markup
├── css/
│   └── style.css       ← all visual styles, including theme variables
└── js/
    └── app.js          ← all application logic
```

### Architectural Style: Module Pattern (IIFE + Namespace)

Because the project uses vanilla JS without a bundler, code is organised with the **Revealing Module Pattern** inside a single `app.js` file. Each dashboard component is encapsulated in its own module object (a plain JavaScript object acting as a namespace), with a public `init()` method called during page load.

```
App
├── StorageService      ← thin wrapper around localStorage (read / write / error handling)
├── ThemeModule         ← light/dark toggle, persistence
├── GreetingModule      ← clock tick, date, greeting text, custom name
├── TimerModule         ← countdown logic, UI state machine, audio alert
├── TodoModule          ← task CRUD, validation, duplicate detection, persistence
└── QuickLinksModule    ← link CRUD, validation, persistence
```

Each module is initialised in sequence in a `DOMContentLoaded` listener inside `app.js`.

### Data Flow

```
User Interaction
      │
      ▼
DOM Event Listener  (in each Module)
      │
      ▼
Domain Logic        (validation, state mutation)
      │
      ├──► StorageService.write()  ──► localStorage
      │
      └──► renderXxx()             ──► DOM update
```

There is no shared reactive state or pub/sub bus. Each module owns its own state variables. Cross-module reads (e.g., TimerModule reading Pomodoro_Duration from storage on reset) go through StorageService.

---

## Components and Interfaces

### StorageService

Provides a safe `localStorage` wrapper used by all data-bearing modules.

```js
StorageService = {
  read(key)          // returns parsed JSON or null; logs + returns null on parse error
  write(key, value)  // serialises to JSON and writes; returns true on success, false on failure
  remove(key)        // removes a key
}
```

Error handling:
- **Read errors** (JSON parse failure): logs `console.error("StorageService: failed to parse '${key}': ${err.message}")` and returns `null`.
- **Write errors** (quota exceeded, security error): returns `false`; callers display an inline error banner.

---

### ThemeModule

Manages the `data-theme` attribute on `<html>` and persists the choice to `localStorage`.

```
localStorage key: "theme"
Values: "light" | "dark"
Default: "light"
```

Public interface:

```js
ThemeModule = {
  init()   // reads saved theme, applies it, wires toggle button
  toggle() // switches theme, updates DOM, persists
}
```

The active theme is expressed as a `data-theme` attribute on `<html>`. CSS uses `[data-theme="dark"]` selectors (and CSS custom properties) to override colours — no class toggling needed.

---

### GreetingModule

Drives the live clock, date display, greeting text, and optional custom name.

```
localStorage key: "userName"
Value: string (1–50 chars) | null
```

Public interface:

```js
GreetingModule = {
  init()          // restores userName, starts clock tick, wires name input
  _tick()         // called by setInterval every 1 000 ms; updates time & greeting
  _getGreeting(hour, userName)  // pure function; returns greeting string
  setUserName(name) // validates, saves, re-renders greeting
}
```

Clock interval: `setInterval(GreetingModule._tick, 1000)` started in `init()`.

Greeting logic (pure function — no side effects, easily testable):

| Hour range | Message |
|---|---|
| 5 – 11 | Good Morning |
| 12 – 17 | Good Afternoon |
| 18 – 20 | Good Evening |
| 21 – 23, 0 – 4 | Good Night |

If `userName` is set: `"Good [Time_Of_Day], [userName]!"`  
If not: `"Good [Time_Of_Day]"`

---

### TimerModule

Implements the Pomodoro countdown as an explicit state machine.

```
States: IDLE | RUNNING | PAUSED
```

```
localStorage key: "pomodoroDuration"
Value: integer 1–99 (minutes)
Default: 25
```

State transitions:

```
IDLE   ──Start──►  RUNNING  ──Stop──►  PAUSED
IDLE   ◄──Reset──  RUNNING
IDLE   ◄──Reset──  PAUSED
RUNNING ◄──(timer ends)──  IDLE  (auto-stop + alert)
PAUSED ──Start──►  RUNNING
```

Public interface:

```js
TimerModule = {
  init()    // reads duration, sets display, wires buttons
  start()   // transitions IDLE/PAUSED → RUNNING; ignored if already RUNNING
  stop()    // transitions RUNNING → PAUSED
  reset()   // clears interval, restores full duration, transitions → IDLE
  _tick()   // decrements remaining seconds; fires _onComplete() at 00:00
  _onComplete()  // stops timer, shows alert banner, plays beep
  _render()      // updates MM:SS display and button enabled/disabled states
}
```

Button enabled/disabled rules per state:

| State | Start | Stop | Reset |
|---|---|---|---|
| IDLE | enabled | disabled | enabled |
| RUNNING | disabled | enabled | enabled |
| PAUSED | enabled | disabled | enabled |

Audio: a short `AudioContext`-generated beep (single oscillator, 440 Hz, ≥ 1 second). If `AudioContext` is unavailable or blocked, the catch block silently falls through — the visible on-page alert is always displayed regardless.

---

### TodoModule

Manages the full task lifecycle.

```
localStorage key: "tasks"
Value: JSON array of Task objects
```

**Task object shape:**

```js
{
  id:        string,   // crypto.randomUUID() or Date.now().toString() fallback
  text:      string,   // 1–200 chars
  completed: boolean,
  createdAt: number    // Date.now() timestamp; used for stable sort on reload
}
```

Public interface:

```js
TodoModule = {
  init()                     // loads tasks from storage, renders list
  addTask(text)              // validates, creates Task, appends, persists
  editTask(id, newText)      // validates, mutates, persists, re-renders item
  toggleComplete(id)         // flips completed flag, persists, re-renders item
  deleteTask(id)             // removes from array, persists, removes DOM node
  _validate(text, excludeId) // returns { ok, error }; checks length + duplicate
  _persist()                 // calls StorageService.write("tasks", tasks)
  _renderAll()               // clears list container, renders each task
  _renderItem(task)          // returns a <li> DOM node for one task
}
```

Duplicate detection (Challenge D):

```js
function isDuplicate(text, excludeId) {
  const normalised = text.trim().toLowerCase();
  return tasks.some(t => t.id !== excludeId && t.text.trim().toLowerCase() === normalised);
}
```

`excludeId` is passed during edits so a task can keep its own name without triggering a false positive.

---

### QuickLinksModule

Manages saved website shortcuts.

```
localStorage key: "links"
Value: JSON array of Link objects
```

**Link object shape:**

```js
{
  id:    string,   // crypto.randomUUID() or Date.now().toString() fallback
  label: string,   // 1–50 chars
  url:   string    // must start with "http://" or "https://"
}
```

Public interface:

```js
QuickLinksModule = {
  init()                  // loads links from storage, renders list
  addLink(label, url)     // validates, creates Link, appends, persists
  deleteLink(id)          // removes from array, persists, removes DOM node
  _validateLabel(label)   // returns { ok, error }
  _validateUrl(url)       // returns { ok, error }; checks protocol + duplicate + max 20
  _persist()              // calls StorageService.write("links", links)
  _renderAll()            // clears links container, renders each link
  _renderItem(link)       // returns a DOM node for one link (anchor + delete button)
}
```

Validation rules summary:

| Field | Rule |
|---|---|
| label | 1–50 chars; non-empty |
| url | starts with `http://` or `https://` |
| url (duplicate) | URL must not already exist in saved links |
| count | total links must be < 20 before adding |

---

## Data Models

### localStorage Key Map

| Key | Owner | Type | Description |
|---|---|---|---|
| `"tasks"` | TodoModule | `Task[]` | All to-do items |
| `"links"` | QuickLinksModule | `Link[]` | All quick links |
| `"theme"` | ThemeModule | `"light" \| "dark"` | Active colour theme |
| `"userName"` | GreetingModule | `string \| null` | Optional display name |
| `"pomodoroDuration"` | TimerModule | `number` | Pomodoro length in minutes |

### Task Model

```ts
interface Task {
  id:        string;   // unique identifier
  text:      string;   // 1–200 characters
  completed: boolean;
  createdAt: number;   // Unix timestamp in ms
}
```

### Link Model

```ts
interface Link {
  id:    string;   // unique identifier
  label: string;   // 1–50 characters
  url:   string;   // http:// or https:// URL
}
```

### Serialisation Contract

All models are stored as JSON strings. On read, the full array is parsed and validated for structural integrity:
- If `JSON.parse` throws → collection initialised as `[]`, error logged to console.
- Missing or `null` key → collection initialised as `[]` silently.
- On write failure → inline error banner shown to user; in-memory state is not rolled back (optimistic update pattern).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Task serialisation round-trip

*For any* array of Task objects (with valid `id`, `text`, `completed`, and `createdAt` fields), serialising the array to a JSON string via `StorageService.write("tasks", tasks)` and then reading it back via `StorageService.read("tasks")` SHALL produce a structurally equal array where every property of every item is identical in type and value to the original.

**Validates: Requirements 7.4, 3.5, 3.6, 5.7**

### Property 2: Link serialisation round-trip

*For any* array of Link objects (with valid `id`, `label`, and `url` fields), serialising the array to a JSON string via `StorageService.write("links", links)` and then reading it back via `StorageService.read("links")` SHALL produce a structurally equal array where every property of every item is identical in type and value to the original.

**Validates: Requirements 7.4, 6.7, 6.8**

### Property 3: Greeting message covers all hours exhaustively

*For any* integer hour in the range 0–23, `_getGreeting(hour, null)` SHALL return exactly one of the strings `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, or `"Good Night"`, and every hour in the range SHALL map to a result (no hour left unhandled or returning an unexpected value).

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

### Property 4: Duplicate task detection is case-insensitive and trim-aware

*For any* string `s` already present in the task list, any string `t` such that `t.trim().toLowerCase() === s.trim().toLowerCase()` SHALL be rejected by `_validate(t, null)` with `{ ok: false }`, and the task list SHALL remain unchanged in both length and content.

**Validates: Requirements 3.2, 3.3**

### Property 5: Task and edit input validation rejects all out-of-range text

*For any* string with length 0, a string composed entirely of whitespace characters, or a string with length greater than 200, `TodoModule._validate(text, null)` SHALL return `{ ok: false }` with a non-empty error message; and the task list SHALL not be modified as a result.

**Validates: Requirements 3.3, 3.4, 4.5, 4.6**

### Property 6: Quick Links URL validation rejects all non-HTTP(S) inputs

*For any* string that does not begin with `"http://"` or `"https://"`, `QuickLinksModule._validateUrl(url)` SHALL return `{ ok: false }` with a non-empty error message, and the link list SHALL remain unchanged.

**Validates: Requirements 6.2, 6.4**

### Property 7: Task add-then-retrieve round-trip

*For any* valid task text (1–200 non-whitespace-only characters, not a duplicate of an existing task), after calling `TodoModule.addTask(text)` the resulting task SHALL appear at the end of the in-memory tasks array with `completed: false` and a valid numeric `createdAt`, and `StorageService.read("tasks")` SHALL return an array whose last element has `text` equal to the submitted value.

**Validates: Requirements 3.2, 3.5, 7.2**

### Property 8: Completion toggle is an involution (toggling twice restores original state)

*For any* task with any initial `completed` value, calling `toggleComplete(id)` twice in sequence SHALL leave the task's `completed` field equal to its original value, and the persisted value in `StorageService.read("tasks")` SHALL also reflect the original state.

**Validates: Requirements 5.2, 5.3, 5.6**

### Property 9: Personalised greeting always contains the user's name

*For any* valid `userName` string (1–50 non-whitespace-only characters) and *for any* hour in the range 0–23, `_getGreeting(hour, userName)` SHALL return a string that contains `userName` as a substring.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

## Error Handling

### LocalStorage Write Failure

**Trigger:** `localStorage.setItem` throws (quota exceeded, `SecurityError`).  
**Handler in `StorageService.write`:** catches the exception, returns `false`.  
**Caller behaviour:** each module checks the return value of `_persist()` and, on `false`, shows a fixed-position inline error banner: *"Changes could not be saved. Your data may not persist after reload."* The banner auto-dismisses after 5 seconds or on user click.

### LocalStorage Read / Parse Failure

**Trigger:** `JSON.parse` throws on a malformed stored string.  
**Handler in `StorageService.read`:** logs `console.error(...)`, returns `null`.  
**Caller behaviour:** modules treat `null` as an empty collection and optionally surface a user-visible warning banner.

### Timer Audio Failure

**Trigger:** `AudioContext` constructor throws or `ctx.resume()` is rejected (browser autoplay policy).  
**Handler:** wrapped in `try/catch`; failure is silently swallowed.  
**Fallback:** the visible on-page alert banner is always rendered unconditionally before the audio attempt.

### Input Validation Errors

All validation errors are displayed inline, adjacent to the relevant input field, using a `<span role="alert">` element so screen readers announce them automatically. Error messages clear when the user modifies the field value.

### Missing DOM Elements

On `init()`, each module queries required DOM elements. If an expected element is `null` (malformed HTML), the module logs a `console.error` and returns early without throwing — preventing one broken panel from crashing the others.

---

## Testing Strategy

### Unit Tests

Unit tests target **pure functions** and functions with no DOM or `localStorage` side effects. The recommended framework for a no-build vanilla JS project is [**QUnit**](https://qunitjs.com/) (loaded via CDN in a separate `test/index.html`).

Focus areas:

| Function | Test type | What to verify |
|---|---|---|
| `GreetingModule._getGreeting(hour, name)` | Unit + Property | All 24 hours map correctly; personalised vs generic |
| `StorageService.read / write` | Unit | Round-trip fidelity; graceful handling of corrupt data |
| `TodoModule._validate(text, excludeId)` | Unit + Property | Empty, max length, duplicate, valid inputs |
| `QuickLinksModule._validateUrl(url)` | Unit + Property | Protocol check, duplicate URL, count limit |
| `TimerModule` state machine | Unit | Correct transitions; start while running is no-op |
| `isDuplicate(text, excludeId)` | Unit + Property | Trim, case-insensitive matching |

### Property-Based Tests

Property-based testing is appropriate for this feature's pure logic functions (serialisation, validation, greeting mapping). The recommended library for no-build environments is [**fast-check**](https://fast-check.dev/) (loaded from CDN).

Minimum 100 iterations per property test. Each test is tagged:

> **Feature: todo-life-dashboard, Property {N}: {property_text}**

| Property | fast-check arbitraries | Iterations |
|---|---|---|
| P1: Task serialisation round-trip | `fc.array(fc.record({id: fc.string(), text: fc.string({minLength:1, maxLength:200}), completed: fc.boolean(), createdAt: fc.integer()}))` | 100 |
| P2: Link serialisation round-trip | `fc.array(fc.record({id: fc.string(), label: fc.string({minLength:1, maxLength:50}), url: fc.constantFrom("http://a.com","https://b.org")}))` | 100 |
| P3: Greeting covers all hours | `fc.integer({min:0, max:23})` | 100 |
| P4: Duplicate detection (trim + case) | `fc.string({minLength:1, maxLength:200})`, then mutate with surrounding whitespace / mixed case | 100 |
| P5: Todo validation rejects out-of-range | `fc.oneof(fc.constant(""), fc.string().map(s => s.replace(/\S/g, ' ')), fc.string({minLength:201, maxLength:500}))` | 100 |
| P6: URL validation rejects non-http(s) | `fc.string().filter(s => !s.startsWith("http://") && !s.startsWith("https://"))` | 100 |
| P7: Task add → retrieve round-trip | `fc.string({minLength:1, maxLength:200}).filter(s => s.trim().length > 0)` | 100 |
| P8: Completion toggle is involution | `fc.boolean()` (initial completed state) | 100 |
| P9: Personalised greeting contains name | `fc.string({minLength:1, maxLength:50}).filter(s => s.trim().length > 0)` × `fc.integer({min:0, max:23})` | 100 |

### Integration / Manual Tests

Because the project has no backend and renders directly to the DOM, end-to-end behaviour is verified manually or with a lightweight DOM testing setup (e.g., using `jsdom` in Node, or browser DevTools):

- Page reload restores all tasks, links, theme, and user name.
- Timer reaches 00:00 and fires alert + beep.
- Storage quota error surfaces the error banner (simulate with DevTools quota override).
- All four panels render correctly in Chrome, Firefox, Edge, and Safari.
- Light/dark toggle persists across reload.

### Accessibility Checks

- All interactive controls have visible focus indicators.
- Validation messages use `role="alert"` or `aria-live="polite"`.
- Theme contrast ratios meet WCAG 2.1 AA (4.5:1 for normal text). Full validation requires manual testing with assistive technologies.
