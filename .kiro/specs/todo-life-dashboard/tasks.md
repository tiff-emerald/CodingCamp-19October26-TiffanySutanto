# Implementation Plan: To-Do Life Dashboard

## Overview

Build a client-side single-page dashboard with plain HTML, CSS, and vanilla JavaScript. The implementation follows the three-file architecture (`index.html`, `css/style.css`, `js/app.js`) and incrementally adds each module — StorageService, ThemeModule, GreetingModule, TimerModule, TodoModule, and QuickLinksModule — then wires them together in a `DOMContentLoaded` listener. All data persists via `localStorage`. Optional challenges A (Light/Dark Mode), B (Custom Name in Greeting), and D (Duplicate Task Prevention) are included in scope.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` at the project root with semantic HTML5 boilerplate
  - Add all four panel sections: `#greeting-panel`, `#timer-panel`, `#todo-panel`, `#links-panel`
  - Add the theme toggle button in the top navigation area
  - Add all required form inputs, buttons, and display containers for every module (clock, date, greeting text, name input, timer display, Start/Stop/Reset buttons, task input, Add button, task list `<ul>`, link label/URL inputs, Add Link button, links container)
  - Include `<link>` to `css/style.css` and `<script src="js/app.js" defer>` — no external dependencies
  - Create `css/style.css` and `js/app.js` as empty placeholder files
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 2. Implement StorageService and ThemeModule
  - [ ] 2.1 Implement `StorageService` in `js/app.js`
    - Write `StorageService.read(key)`: wraps `localStorage.getItem`, calls `JSON.parse`, logs `console.error` and returns `null` on parse failure
    - Write `StorageService.write(key, value)`: calls `JSON.stringify` + `localStorage.setItem`, returns `true` on success and `false` on any thrown exception
    - Write `StorageService.remove(key)`: calls `localStorage.removeItem`
    - _Requirements: 7.1, 7.4, 7.5, 7.6_

  - [ ]* 2.2 Write property test for StorageService serialisation round-trip
    - Create `test/index.html` loading QUnit and fast-check via CDN
    - **Property 1: Task serialisation round-trip** — for any array of valid Task objects, `write("tasks", tasks)` followed by `read("tasks")` returns a structurally equal array
    - **Property 2: Link serialisation round-trip** — for any array of valid Link objects, `write("links", links)` followed by `read("links")` returns a structurally equal array
    - **Validates: Requirements 7.4, 3.5, 3.6, 5.7, 6.7, 6.8**

  - [ ] 2.3 Implement `ThemeModule` in `js/app.js`
    - Write `ThemeModule.init()`: reads `localStorage` key `"theme"` via `StorageService.read`, defaults to `"light"`, sets `data-theme` attribute on `<html>`, wires click handler on the theme toggle button
    - Write `ThemeModule.toggle()`: flips the current theme, updates `document.documentElement.dataset.theme`, calls `StorageService.write("theme", newTheme)`
    - _Requirements: A.1, A.2, A.3, A.4, A.5, A.6_

  - [ ] 2.4 Implement CSS custom properties and theme styles in `css/style.css`
    - Define `:root` CSS custom properties for all colours (background, surface, text, accent, muted)
    - Define `[data-theme="dark"]` overrides for every custom property
    - Add base layout: four-panel grid visible without scrolling on 1280 × 800; top nav bar
    - Add focus indicators for all interactive controls (buttons, inputs)
    - _Requirements: 8.1, A.2, 9.1_

- [ ] 3. Implement GreetingModule
  - [ ] 3.1 Implement `GreetingModule._getGreeting(hour, userName)` pure function
    - Return `"Good Morning"` for hours 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–20, `"Good Night"` for 21–23 and 0–4
    - Append `, [userName]!` suffix when `userName` is a non-empty string; otherwise return the bare greeting string
    - _Requirements: 1.3, 1.4, 1.5, 1.6, B.2, B.5_

  - [ ]* 3.2 Write property tests for `_getGreeting`
    - **Property 3: Greeting covers all hours exhaustively** — for any integer 0–23, `_getGreeting(hour, null)` returns exactly one of the four valid greeting strings
    - **Property 9: Personalised greeting contains the user's name** — for any valid `userName` (1–50 non-whitespace chars) and any hour 0–23, `_getGreeting(hour, userName)` returns a string containing `userName` as a substring
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6, B.2**

  - [ ] 3.3 Implement `GreetingModule.init()`, `_tick()`, and `setUserName()`
    - Write `init()`: reads `"userName"` from storage, starts `setInterval(GreetingModule._tick, 1000)`, wires name input's submit/Enter handler to `setUserName`
    - Write `_tick()`: builds current time string in HH:MM:SS, builds date string in `"DayName, MonthName DD, YYYY"` format, calls `_getGreeting` with current hour, updates DOM elements for clock, date, and greeting
    - Write `setUserName(name)`: validates 1–50 non-whitespace-only characters; on valid input saves to `StorageService.write("userName", name)` and re-renders greeting; on invalid input retains current greeting silently
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, B.1, B.2, B.3, B.4, B.5_

- [ ] 4. Implement TimerModule
  - [ ] 4.1 Implement `TimerModule` state machine and core logic
    - Declare `state` variable with values `IDLE | RUNNING | PAUSED`
    - Write `init()`: reads `"pomodoroDuration"` from storage (default 25, valid range 1–99), sets `remaining` seconds, calls `_render()`
    - Write `start()`: transitions `IDLE/PAUSED → RUNNING` via `setInterval(TimerModule._tick, 1000)`; no-op if already `RUNNING`
    - Write `stop()`: clears interval, transitions `RUNNING → PAUSED`, calls `_render()`
    - Write `reset()`: clears interval, restores `remaining` to full duration, transitions any state `→ IDLE`, calls `_render()`
    - Write `_tick()`: decrements `remaining`; if `remaining <= 0` calls `_onComplete()`; else calls `_render()`
    - Write `_onComplete()`: clears interval, sets state `IDLE`, calls `_render()`, displays visible on-page alert banner, attempts `AudioContext` beep (440 Hz, ≥ 1 s) wrapped in `try/catch`
    - Write `_render()`: formats MM:SS display; sets `disabled` attribute on Start/Stop/Reset buttons per state table in design
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 4.2 Write unit tests for `TimerModule` state transitions
    - Test that `start()` while `RUNNING` is a no-op (state and interval unchanged)
    - Test that `reset()` from any state returns to `IDLE` with full duration
    - Test that `stop()` transitions `RUNNING → PAUSED` and retains remaining time
    - _Requirements: 2.3, 2.4, 2.5, 2.7, 2.8, 2.9_

- [ ] 5. Checkpoint — core modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement TodoModule — validation and add
  - [ ] 6.1 Implement `TodoModule._validate(text, excludeId)` and `isDuplicate`
    - Write `_validate(text, excludeId)`: returns `{ ok: false, error: "..." }` for empty/whitespace-only strings, strings longer than 200 characters, and case-insensitive trim-aware duplicates (Challenge D); returns `{ ok: true }` otherwise
    - Write `isDuplicate(text, excludeId)`: normalises with `text.trim().toLowerCase()`, checks `tasks` array excluding `excludeId`
    - _Requirements: 3.3, 3.4, 4.5, 4.6, D.1, D.2_

  - [ ]* 6.2 Write property tests for `TodoModule._validate`
    - **Property 4: Duplicate detection is case-insensitive and trim-aware** — for any string already in the list, any string `t` where `t.trim().toLowerCase()` equals the original normalised text is rejected with `{ ok: false }`
    - **Property 5: Validation rejects all out-of-range text** — empty strings, whitespace-only strings, and strings > 200 chars all return `{ ok: false }` with a non-empty error message
    - **Validates: Requirements 3.3, 3.4, 4.5, 4.6, D.1, D.2**

  - [ ] 6.3 Implement `TodoModule.addTask(text)` and `_persist()`
    - Write `addTask(text)`: calls `_validate(text, null)`; on failure displays inline `<span role="alert">` error adjacent to the input; on success creates a Task object `{ id: crypto.randomUUID() || Date.now().toString(), text, completed: false, createdAt: Date.now() }`, pushes to `tasks` array, calls `_persist()`, appends `_renderItem(task)` to the list container, clears input field
    - Write `_persist()`: calls `StorageService.write("tasks", tasks)`; on `false` return shows inline error banner "Changes could not be saved…" that auto-dismisses after 5 seconds or on click
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.2, D.1_

  - [ ]* 6.4 Write property test for task add-then-retrieve round-trip
    - **Property 7: Task add → retrieve round-trip** — for any valid task text, after `addTask(text)` the last element of `StorageService.read("tasks")` has `text` equal to the submitted value and `completed: false`
    - **Validates: Requirements 3.2, 3.5, 7.2**

- [ ] 7. Implement TodoModule — render, edit, complete, delete
  - [ ] 7.1 Implement `TodoModule._renderItem(task)` and `_renderAll()`
    - Write `_renderItem(task)`: returns a `<li>` DOM node containing a checkbox, task text `<span>`, Edit button, and Delete button; applies strikethrough + muted styling when `task.completed === true`; sets `data-id` attribute on the `<li>`
    - Write `_renderAll()`: clears the `<ul>` container and calls `_renderItem` for every task in the `tasks` array
    - _Requirements: 3.2, 5.1, 5.2, 5.3, 5.4_

  - [ ] 7.2 Implement `TodoModule.toggleComplete(id)` and `deleteTask(id)`
    - Write `toggleComplete(id)`: flips `task.completed`, calls `_persist()`, re-renders the single `<li>` in place (or calls `_renderAll()`)
    - Write `deleteTask(id)`: removes task from `tasks` array, calls `_persist()`, removes the corresponding `<li>` from the DOM
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.2_

  - [ ]* 7.3 Write property test for completion toggle involution
    - **Property 8: Completion toggle is an involution** — for any task with any initial `completed` value, calling `toggleComplete(id)` twice returns `completed` to its original value and `StorageService.read("tasks")` reflects the original state
    - **Validates: Requirements 5.2, 5.3, 5.6**

  - [ ] 7.4 Implement `TodoModule.editTask(id, newText)`
    - Write `editTask(id, newText)`: calls `_validate(newText, id)` (passing `id` as `excludeId` to avoid false self-duplicate); on failure displays inline error and keeps edit mode open; on success updates `task.text`, calls `_persist()`, re-renders the `<li>` in display mode
    - Wire Edit button click handler: replaces the task text `<span>` with a pre-filled `<input>` with cursor at end; confirm on Enter key or a Save button click; cancel (restore display mode) on Escape key
    - Handle the "already in edit mode" case: clicking Edit on an already-open edit item keeps the existing input without resetting its value
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, D.2_

  - [ ] 7.5 Implement `TodoModule.init()`
    - Write `init()`: calls `StorageService.read("tasks")`, initialises `tasks` array (defaults to `[]` on `null` result, shows error banner if read returned `null` due to parse failure), calls `_renderAll()`, wires Add button click and input keydown (Enter) to `addTask`
    - _Requirements: 3.6, 3.7, 7.4, 7.5_

- [ ] 8. Implement QuickLinksModule
  - [ ] 8.1 Implement `QuickLinksModule._validateLabel` and `_validateUrl`
    - Write `_validateLabel(label)`: returns `{ ok: false, error }` for empty or > 50 char labels; returns `{ ok: true }` otherwise
    - Write `_validateUrl(url)`: returns `{ ok: false, error }` if url does not start with `"http://"` or `"https://"`; if url is a duplicate of an existing link's url; if total links count is already 20; returns `{ ok: true }` otherwise
    - _Requirements: 6.2, 6.4, 6.9, 6.10_

  - [ ]* 8.2 Write property test for URL validation
    - **Property 6: URL validation rejects all non-HTTP(S) inputs** — for any string not starting with `"http://"` or `"https://"`, `_validateUrl` returns `{ ok: false }` with a non-empty error message
    - **Validates: Requirements 6.2, 6.4**

  - [ ] 8.3 Implement `QuickLinksModule.addLink(label, url)`, `deleteLink(id)`, and `_persist()`
    - Write `addLink(label, url)`: runs both validators; on failure displays inline `<span role="alert">` errors adjacent to invalid fields; on success creates a Link object `{ id, label, url }`, pushes to `links`, calls `_persist()`, appends `_renderItem(link)`
    - Write `deleteLink(id)`: removes link from `links` array, calls `_persist()`, removes the DOM node
    - Write `_persist()`: calls `StorageService.write("links", links)`; shows inline error banner on `false` return
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9, 6.10, 7.3_

  - [ ] 8.4 Implement `QuickLinksModule._renderItem(link)`, `_renderAll()`, and `init()`
    - Write `_renderItem(link)`: returns a DOM node containing an `<a>` element with `href=link.url` and `target="_blank"` and a Delete button; set `rel="noopener noreferrer"` on the anchor
    - Write `_renderAll()`: clears the links container and calls `_renderItem` for every link
    - Write `init()`: reads `"links"` from storage via `StorageService.read`, initialises `links` array (defaults to `[]`), calls `_renderAll()`, wires Add Link button click handler
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 6.8_

- [ ] 9. Checkpoint — all modules implemented
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Wire all modules together and finalise
  - [ ] 10.1 Wire module initialisation in `DOMContentLoaded` listener in `js/app.js`
    - Add a single `document.addEventListener("DOMContentLoaded", () => { ... })` at the bottom of `app.js`
    - Call `StorageService` (no init needed), then `ThemeModule.init()`, `GreetingModule.init()`, `TimerModule.init()`, `TodoModule.init()`, `QuickLinksModule.init()` in sequence
    - Each `init()` must guard against missing DOM elements: log `console.error` and return early if a required element is `null`
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2_

  - [ ] 10.2 Style all four panels in `css/style.css`
    - Style the Greeting panel: clock in large font, date below, greeting text, name input inline
    - Style the Focus Timer panel: MM:SS display prominent, three buttons in a row, alert banner style, disabled button appearance
    - Style the To-Do List panel: input + Add button row, scrollable task list, checkbox + text + Edit + Delete layout per item, strikethrough + muted styles for completed tasks, inline error `<span>` style
    - Style the Quick Links panel: label + URL input row, Add Link button, link grid/list, anchor button style, Delete button per link, inline error `<span>` style
    - Apply responsive layout adjustments so all four panels are visible without scrolling at 1280 × 800
    - _Requirements: 5.2, 5.3, 8.1, 9.1_

  - [ ]* 10.3 Write integration tests for full page reload persistence
    - Test that after calling `TodoModule.addTask`, `toggleComplete`, and `editTask` in sequence, `StorageService.read("tasks")` returns the correct final state
    - Test that after `QuickLinksModule.addLink` and `deleteLink`, `StorageService.read("links")` returns the correct final state
    - Test that after `ThemeModule.toggle()`, `StorageService.read("theme")` returns the toggled value
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 11. Final checkpoint — full application complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after major phases
- Property tests use **fast-check** loaded from CDN in `test/index.html`; unit tests use **QUnit** from CDN — no build step required
- All property tests require a minimum of 100 iterations
- Optional challenges A (Light/Dark Mode), B (Custom Name), and D (Duplicate Task Prevention) are integrated into their respective module tasks rather than added as a separate phase
- The `excludeId` parameter in `_validate` is critical for edit flows — passing the edited task's own id prevents false duplicate rejections

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3.1", "3.3"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["6.4", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.4", "7.5"] },
    { "id": 8, "tasks": ["7.3", "8.1"] },
    { "id": 9, "tasks": ["8.2", "8.3"] },
    { "id": 10, "tasks": ["8.4"] },
    { "id": 11, "tasks": ["10.1", "10.2"] },
    { "id": 12, "tasks": ["10.3"] }
  ]
}
```
