# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application that helps users organize their day through a single-page dashboard. It combines a live clock with greeting, a Pomodoro-style focus timer, a full-featured to-do list, and a quick-links panel. All user data is persisted in the browser's Local Storage — no backend server is required. The app can be opened as a standalone HTML file or used as a browser new-tab/homepage replacement.

## Glossary

- **Dashboard**: The single HTML page that contains all four panels (Greeting, Focus Timer, To-Do List, Quick Links).
- **Greeting_Panel**: The section of the Dashboard that displays the current time, date, and a time-based greeting message.
- **Focus_Timer**: The countdown timer component that implements the Pomodoro technique.
- **Todo_List**: The component that manages the user's tasks (add, edit, complete, delete, persist).
- **Task**: A single to-do item stored and displayed inside the Todo_List.
- **Quick_Links**: The component that stores and displays user-defined website shortcuts.
- **Link**: A single saved website shortcut stored inside Quick_Links.
- **Local_Storage**: The browser's `localStorage` API used for client-side data persistence.
- **Pomodoro_Duration**: The configurable countdown length used by the Focus_Timer (default: 25 minutes).
- **Theme**: The visual color scheme of the Dashboard (light or dark).
- **User_Name**: An optional custom name the user can set, displayed in the Greeting_Panel.

---

## Requirements

### Requirement 1: Live Greeting Panel

**User Story:** As a user, I want to see the current time, date, and a personalized greeting when I open the dashboard, so that I immediately know what time it is and feel welcomed.

#### Acceptance Criteria

1. THE Greeting_Panel SHALL display the current time in HH:MM:SS format (zero-padded hours, minutes, and seconds in the user's local device timezone), updating every second within a tolerance of ±500ms per tick.
2. THE Greeting_Panel SHALL display the current date in the format "DayName, MonthName DD, YYYY" (e.g., "Wednesday, October 26, 2026") based on the user's local device date.
3. IF the current local hour is 5, 6, 7, 8, 9, 10, or 11, THEN THE Greeting_Panel SHALL display the message "Good Morning".
4. IF the current local hour is 12, 13, 14, 15, 16, or 17, THEN THE Greeting_Panel SHALL display the message "Good Afternoon".
5. IF the current local hour is 18, 19, or 20, THEN THE Greeting_Panel SHALL display the message "Good Evening".
6. IF the current local hour is 21, 22, 23, 0, 1, 2, 3, or 4, THEN THE Greeting_Panel SHALL display the message "Good Night".

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a countdown timer on my dashboard, so that I can time focused work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. THE Focus_Timer SHALL display the remaining time in MM:SS format, where MM is zero-padded and ranges from 00 to 99, and SS is zero-padded and ranges from 00 to 59.
2. THE Focus_Timer SHALL initialise with the Pomodoro_Duration (default: 25 minutes; valid range: 1–99 minutes) when the page loads.
3. WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down by decrementing the display by exactly 1 second per interval and updating the display after each decrement.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop the countdown and restore the display to the Pomodoro_Duration.
6. WHEN the Focus_Timer reaches 00:00, THE Focus_Timer SHALL stop automatically, display a visible on-page alert message, and play an audible beep lasting at least 1 second.
7. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the Start control and enable the Stop and Reset controls.
8. WHILE the Focus_Timer is stopped or paused, THE Focus_Timer SHALL enable the Start control and disable the Stop control.
9. IF the user activates the Start control while the Focus_Timer is already counting down, THEN THE Focus_Timer SHALL ignore the activation and continue the current countdown without interruption.
10. IF the audible beep cannot be played due to browser audio restrictions, THEN THE Focus_Timer SHALL still display the visible on-page alert message as the sole notification fallback.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to my to-do list and see them displayed, so that I can track what I need to do today.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an input field accepting up to 200 characters and an Add button for entering new Tasks.
2. WHEN the user submits a non-empty task name of 1 to 200 characters, THE Todo_List SHALL append the new Task to the bottom of the task list and display it.
3. IF the user attempts to submit an empty task name, THEN THE Todo_List SHALL reject the submission and display an inline validation message indicating that the task name cannot be empty.
4. IF the user attempts to submit a task name exceeding 200 characters, THEN THE Todo_List SHALL reject the submission and display an inline validation message indicating the character limit.
5. THE Todo_List SHALL persist all Tasks to Local_Storage after every add operation such that the stored data reflects the complete current task list.
6. WHEN the Dashboard loads, THE Todo_List SHALL restore all previously saved Tasks from Local_Storage and display them in the order they were originally added.
7. IF Local_Storage is unavailable or returns a read error on Dashboard load, THEN THE Todo_List SHALL display an empty task list and show an error message indicating that saved tasks could not be restored.

---

### Requirement 4: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct mistakes or update task descriptions.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an Edit control for each Task.
2. WHEN the user activates the Edit control for a Task, THE Todo_List SHALL replace the Task's display text with an editable input field pre-filled with the current task name, with the cursor positioned at the end of the text.
3. WHEN the user activates the Edit control for a Task that is already in edit mode, THE Todo_List SHALL keep the existing editable input field open without resetting its current value.
4. WHEN the user confirms the edit with a non-empty value of 1 to 200 characters, THE Todo_List SHALL update the Task's stored text and return the Task to display mode.
5. IF the user confirms an edit with an empty value, THEN THE Todo_List SHALL reject the change and return the Task to display mode without modification.
6. IF the user confirms an edit with a value exceeding 200 characters, THEN THE Todo_List SHALL reject the change and display an error message indicating the character limit.
7. THE Todo_List SHALL persist the updated Task text to Local_Storage after every successful edit.

---

### Requirement 5: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can keep my list current and clutter-free.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a completion toggle (e.g., a checkbox) for each Task.
2. WHEN the user activates the completion toggle for an incomplete Task, THE Todo_List SHALL apply a strikethrough style to the Task's text and reduce its visual prominence (e.g., lower opacity or muted color) to indicate completion.
3. WHEN the user activates the completion toggle for a completed Task, THE Todo_List SHALL remove the strikethrough style and restore the Task's text to its default opacity and color to indicate it is incomplete.
4. THE Todo_List SHALL provide a Delete control for each Task.
5. WHEN the user activates the Delete control for a Task, THE Todo_List SHALL remove the Task from the list and from Local_Storage.
6. WHEN the user activates the completion toggle for a Task, THE Todo_List SHALL persist the updated completion state to Local_Storage.
7. THE Todo_List SHALL store each Task's completion state as a boolean value in the Local_Storage JSON so that the completion state is fully restored after a page reload.

---

### Requirement 6: Quick Links

**User Story:** As a user, I want to save and access my favorite website shortcuts from the dashboard, so that I can navigate to commonly used sites with one click.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide an input form for entering a link label and a URL.
2. WHEN the user submits a label between 1 and 50 characters and a URL beginning with `http://` or `https://`, THE Quick_Links SHALL add the Link and display it as a clickable button or anchor.
3. WHEN the user activates a Link, THE Quick_Links SHALL open the corresponding URL in a new browser tab.
4. IF the user submits an empty label, a label exceeding 50 characters, or a URL that does not begin with `http://` or `https://`, THEN THE Quick_Links SHALL reject the submission and display a validation error message adjacent to the invalid field.
5. THE Quick_Links SHALL provide a Delete control for each Link.
6. WHEN the user activates the Delete control for a Link, THE Quick_Links SHALL remove the Link from the display and from Local_Storage.
7. THE Quick_Links SHALL persist all Links to Local_Storage after every add or delete operation.
8. WHEN the Dashboard loads, THE Quick_Links SHALL restore all previously saved Links from Local_Storage.
9. IF the user submits a new Link when 20 Links are already saved, THEN THE Quick_Links SHALL reject the submission and display an error message indicating the maximum number of links has been reached.
10. IF the user submits a URL that is identical to an existing saved Link's URL, THEN THE Quick_Links SHALL reject the submission and display an error message indicating the URL is already saved.

---

### Requirement 7: Data Persistence (Local Storage)

**User Story:** As a user, I want my tasks and links to survive a page refresh or browser restart, so that I do not lose my data between sessions.

#### Acceptance Criteria

1. THE Dashboard SHALL use Local_Storage as the sole data persistence mechanism.
2. WHEN any Task is created, updated, or deleted, THE Dashboard SHALL write the full Task list to Local_Storage as a serialized JSON string under the key `"tasks"`.
3. WHEN any Link is created or deleted, THE Dashboard SHALL write the full Link list to Local_Storage as a serialized JSON string under the key `"links"`.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the values at keys `"tasks"` and `"links"` from Local_Storage, parse them as JSON, and restore each collection such that every property of every item is identical in type and value to what was written.
5. IF Local_Storage data for Tasks or Links cannot be parsed, THEN THE Dashboard SHALL initialise those collections as empty and log an error message to the browser console that identifies which collection failed and the reason for the failure.
6. IF a write to Local_Storage fails (e.g., storage quota exceeded or access denied), THEN THE Dashboard SHALL display an inline error message indicating that data could not be saved and the current changes may not persist after a page reload.

---

### Requirement 8: Single-File Architecture

**User Story:** As a developer, I want the project to follow a strict folder structure, so that the codebase stays clean and easy to maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL be structured with exactly one HTML file at the project root, one CSS file inside a `css/` directory, and one JavaScript file inside a `js/` directory.
2. THE Dashboard SHALL require no build step, package manager, or backend server to run.
3. THE Dashboard SHALL function correctly when opened directly in a modern browser via the `file://` protocol or a local HTTP server.

---

### Requirement 9: Browser Compatibility

**User Story:** As a user, I want the dashboard to work in any modern browser, so that I am not restricted to a specific browser.

#### Acceptance Criteria

1. THE Dashboard SHALL render and function correctly in the current stable release of Chrome, Firefox, Edge, and Safari.
2. THE Dashboard SHALL use only standard Web APIs available in modern browsers without polyfills.

---

## Optional Challenge Requirements

### Optional Challenge A: Light / Dark Mode

**User Story:** As a user, I want to toggle between a light and dark color scheme, so that I can reduce eye strain in low-light environments.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme toggle control in the top navigation area that remains visible regardless of scroll position.
2. WHEN the user activates the Theme toggle, THE Dashboard SHALL switch the active Theme between light and dark and update the visual appearance of all Dashboard components accordingly.
3. WHEN the user activates the Theme toggle, THE Dashboard SHALL persist the selected Theme to Local_Storage.
4. WHEN the Dashboard loads, THE Dashboard SHALL restore the previously saved Theme from Local_Storage.
5. IF no Theme preference is saved, THEN THE Dashboard SHALL apply the light Theme by default.
6. IF Local_Storage is unavailable, THEN THE Dashboard SHALL apply the light Theme by default without persisting the selection.

---

### Optional Challenge B: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so the greeting addresses me personally, so that the dashboard feels more welcoming.

#### Acceptance Criteria

1. THE Greeting_Panel SHALL provide an input field for the user to enter a User_Name of between 1 and 50 characters.
2. WHEN the user submits a non-empty, non-whitespace-only User_Name (by pressing Enter or activating a confirm button), THE Greeting_Panel SHALL display the greeting as "Good [Time_Of_Day], [User_Name]!" instead of the generic greeting and persist the User_Name to Local_Storage.
3. IF the submitted User_Name is empty or contains only whitespace characters, THEN THE Greeting_Panel SHALL retain the current greeting without updating Local_Storage.
4. WHEN the Dashboard loads, THE Greeting_Panel SHALL restore the User_Name from Local_Storage and display the personalised greeting.
5. IF no User_Name is saved, THEN THE Greeting_Panel SHALL display the generic greeting without a name.

---

### Optional Challenge D: Prevent Duplicate Tasks

**User Story:** As a user, I want the system to stop me from adding the same task twice, so that my list stays clean and free of redundant entries.

#### Acceptance Criteria

1. WHEN the user submits a new Task whose name matches an existing Task name (case-insensitive, ignoring leading and trailing whitespace), THE Todo_List SHALL reject the submission, retain the submitted text in the input field, and display an inline validation message below the input field indicating that the task already exists; the message SHALL remain visible until the user modifies the input field value.
2. WHEN the user confirms an edited Task name that matches an existing different Task name (case-insensitive, ignoring leading and trailing whitespace), THE Todo_List SHALL reject the change, retain the edited text in the input field, and display an inline validation message below the input field indicating the duplicate; the message SHALL remain visible until the user modifies the input field value.
