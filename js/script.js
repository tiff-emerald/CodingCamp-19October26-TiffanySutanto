//Tiffany's coding script for JS

// Bagian-bagian:
// 1. Safe local storage reading/writing
// 2. Dark/Light Theme
// 3. Greeting
// 4. Timer
// 5. Tasks
// 6. Links


//1. Safe Local Storage Reading/Writing
function load(key, fallback) {
    try{
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;  
    }
    catch(e) {
        return fallback;
    }
}

function save(key, value){
    localStorage.setItem(key, JSON.stringify(value));
}

const themeButton = document.getElementById("theme-toggle");

//2. Enable DarK Theme
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeButton.textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

themeButton.addEventListener("click", function() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    save("theme", next);
});

applyTheme(load("theme", "light"));

//3. Greeting
const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");
const greetingEl = document.getElementById("greeting");
const nameInput = document.getElementById("name-input");
const nameSave = document.getElementById("name-save");

    //Put username input into variable
let userName = load("username", "");
nameInput.value= userName;

    //Morning/afternoon/evening?
function getGreeting(hour) {
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}


function updateClock() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"});
    dateEl.textContent = now.toLocaleDateString([], {weekday: "long", month: "long", day:"numeric", year:"numeric"});
    const text = getGreeting(now.getHours());
    greetingEl.textContent = userName? text + ", " + userName + "!" : text + "!";
}


nameSave.addEventListener("click", function() {
    userName = nameInput.value.trim();
    save("userName", userName);
    updateClock();
})

updateClock(); //1st call draws the clock
setInterval(updateClock, 1000); //1000 ms: refresh (repeat) every second

//4. Timer (25 min)
const TIMER_SECONDS = 25 * 60; //25 minutes times 60 seconds, constant value
const timerDisplay = document.getElementById("timer-display");
let secondsLeft = TIMER_SECONDS;
let timerId = null;

function showTimer() {
  const m = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const s = String(secondsLeft % 60).padStart(2, "0");
  timerDisplay.textContent = m + ":" + s;
}
 
function startTimer() {
  if (timerId !== null) return; // already running
  timerId = setInterval(function () {
    secondsLeft--;
    showTimer();
    if (secondsLeft <= 0) {
      stopTimer();
      alert("Time's up! Take a short break.");
    }
  }, 1000);
}
 
function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}
 
function resetTimer() {
  stopTimer();
  secondsLeft = TIMER_SECONDS;
  showTimer();
}
 
document.getElementById("timer-start").addEventListener("click", startTimer);
document.getElementById("timer-stop").addEventListener("click", stopTimer);
document.getElementById("timer-reset").addEventListener("click", resetTimer);
 
// 5. Tasks (To-do List)
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskError = document.getElementById("task-error");
const taskList = document.getElementById("task-list");
 
// Misalnya: ( id: 123, text: "Buy milk", done: false )
let tasks = load("tasks", []);
 
// Challenge ke-3: Prevent duplicate tasks (ignores upper/lower case)
function isDuplicate(text, ignoreId) {
  return tasks.some(function (t) {
    return t.id !== ignoreId && t.text.toLowerCase() === text.toLowerCase();
  });
}
 
function renderTasks() {
  taskList.innerHTML = "";
 
  if (tasks.length === 0) {
    taskList.innerHTML = '<li class="empty">No tasks yet. Add your first one above.</li>';
    return;
  }
 
  tasks.forEach(function (task) {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " done" : "");
 
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = task.done;
    check.addEventListener("change", function () {
      task.done = check.checked;
      save("tasks", tasks);
      renderTasks();
    });
 
    // textContent (not innerHTML) keeps user text safe
    const label = document.createElement("span");
    label.textContent = task.text;
 
    const editBtn = document.createElement("button");
    editBtn.className = "btn-ghost small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function () {
      const newText = prompt("Edit your task:", task.text);
      if (newText === null) return; // user pressed Cancel
      const trimmed = newText.trim();
      if (trimmed === "") return;
      if (isDuplicate(trimmed, task.id)) {
        taskError.textContent = "That task already exists.";
        return;
      }
      taskError.textContent = "";
      task.text = trimmed;
      save("tasks", tasks);
      renderTasks();
    });
 
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-ghost small delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () {
      tasks = tasks.filter(function (t) { return t.id !== task.id; });
      save("tasks", tasks);
      renderTasks();
    });
 
    li.append(check, label, editBtn, deleteBtn);
    taskList.appendChild(li);
  });
}
 
taskForm.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the page from reloading
  const text = taskInput.value.trim();
  if (text === "") return;
 
  if (isDuplicate(text, null)) {
    taskError.textContent = "That task already exists.";
    return;
  }
 
  taskError.textContent = "";
  tasks.push({ id: Date.now(), text: text, done: false });
  save("tasks", tasks);
  taskInput.value = "";
  renderTasks();
});
 
renderTasks();
 
//6. Links
const linkForm = document.getElementById("link-form");
const linkName = document.getElementById("link-name");
const linkUrl = document.getElementById("link-url");
const linkList = document.getElementById("link-list");
 
// Default links shown the first time the app is opened
let links = load("links", [
  { id: 1, name: "Google", url: "https://www.google.com" },
  { id: 2, name: "YouTube", url: "https://www.youtube.com" }
]);
 
function renderLinks() {
  linkList.innerHTML = "";
 
  links.forEach(function (link) {
    const wrapper = document.createElement("div");
    wrapper.className = "link-item";
 
    const a = document.createElement("a");
    a.href = link.url;
    a.textContent = link.name;
    a.target = "_blank";          // open in a new tab
    a.rel = "noopener noreferrer"; // safety for new tabs
 
    const remove = document.createElement("button");
    remove.textContent = "x";
    remove.setAttribute("aria-label", "Remove " + link.name);
    remove.addEventListener("click", function () {
      links = links.filter(function (l) { return l.id !== link.id; });
      save("links", links);
      renderLinks();
    });
 
    wrapper.append(a, remove);
    linkList.appendChild(wrapper);
  });
}
 
linkForm.addEventListener("submit", function (event) {
  event.preventDefault();
  let url = linkUrl.value.trim();
  // Add https:// if the user forgot it
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
 
  links.push({ id: Date.now(), name: linkName.value.trim(), url: url });
  save("links", links);
  linkName.value = "";
  linkUrl.value = "";
  renderLinks();
});
 
renderLinks();
