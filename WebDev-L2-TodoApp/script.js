/*
 * To-Do App — Oasis Infobyte Web Development Internship (Level 2, Task 3)
 * Author: Aman Kapuria
 *
 * Every task is an object like:
 *   { id, text, completed, createdAt, completedAt }
 * All tasks live in one array, which is saved to localStorage
 * so they stay after the page is refreshed.
 */

const STORAGE_KEY = "oibsip-todo-tasks";

const form = document.getElementById("addForm");
const input = document.getElementById("taskInput");
const formError = document.getElementById("formError");
const pendingList = document.getElementById("pendingList");
const completedList = document.getElementById("completedList");
const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");
const pendingEmpty = document.getElementById("pendingEmpty");
const completedEmpty = document.getElementById("completedEmpty");
const template = document.getElementById("taskTemplate");

let tasks = loadTasks();

/* ---------- Saving and loading ---------- */

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage can be blocked (for example in private mode). The app still works for this visit.
  }
}

/* ---------- Helpers ---------- */

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function showFormError(message) {
  formError.textContent = message;
  if (message) setTimeout(() => (formError.textContent = ""), 2500);
}

/* ---------- Drawing the lists ---------- */

function render() {
  pendingList.innerHTML = "";
  completedList.innerHTML = "";

  const pending = tasks.filter((t) => !t.completed);
  // Newest completed at the top
  const completed = tasks
    .filter((t) => t.completed)
    .sort((a, b) => b.completedAt - a.completedAt);

  pending.forEach((task) => pendingList.appendChild(buildTaskRow(task)));
  completed.forEach((task) => completedList.appendChild(buildTaskRow(task)));

  pendingCount.textContent = `${pending.length} pending`;
  completedCount.textContent = `${completed.length} completed`;

  // Friendly message when a list is empty
  pendingEmpty.hidden = pending.length > 0;
  completedEmpty.hidden = completed.length > 0;
}

function buildTaskRow(task) {
  const row = template.content.firstElementChild.cloneNode(true);
  row.dataset.id = task.id;
  row.classList.toggle("completed", task.completed);

  row.querySelector(".task-text").textContent = task.text;

  // Timestamps (bonus feature)
  let timeText = `Added ${formatTime(task.createdAt)}`;
  if (task.completed && task.completedAt) {
    timeText += ` · Completed ${formatTime(task.completedAt)}`;
  }
  row.querySelector(".task-time").textContent = timeText;

  const check = row.querySelector(".check");
  const label = task.completed ? "Mark as pending" : "Mark complete";
  check.title = label;
  check.setAttribute("aria-label", label);

  return row;
}

/* ---------- Actions ---------- */

function addTask(text) {
  tasks.push({
    id: makeId(),
    text,
    completed: false,
    createdAt: Date.now(),
    completedAt: null,
  });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  task.completedAt = task.completed ? Date.now() : null;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

function startEditing(row) {
  const task = tasks.find((t) => t.id === row.dataset.id);
  if (!task) return;

  const editInput = row.querySelector(".edit-input");
  row.classList.add("editing");
  editInput.value = task.text;
  editInput.focus();
  editInput.select();

  const finish = (save) => {
    if (!row.classList.contains("editing")) return;
    row.classList.remove("editing");
    const newText = editInput.value.trim();
    if (save && newText) {
      task.text = newText;
      saveTasks();
    }
    render();
  };

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
  editInput.addEventListener("blur", () => finish(true));
}

/* ---------- Event listeners ---------- */

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    showFormError("Please type a task first.");
    input.focus();
    return;
  }
  addTask(text);
  input.value = "";
  input.focus();
});

// One listener for each list handles every button inside it
[pendingList, completedList].forEach((list) => {
  list.addEventListener("click", (event) => {
    const row = event.target.closest(".task");
    if (!row) return;

    if (event.target.closest(".check")) toggleTask(row.dataset.id);
    else if (event.target.closest(".edit")) startEditing(row);
    else if (event.target.closest(".delete")) deleteTask(row.dataset.id);
  });

  // Double-click the text to edit it as well
  list.addEventListener("dblclick", (event) => {
    if (event.target.classList.contains("task-text")) {
      startEditing(event.target.closest(".task"));
    }
  });
});

document.getElementById("today").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

render();
