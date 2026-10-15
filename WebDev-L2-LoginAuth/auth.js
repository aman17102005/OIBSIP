/*
 * Login Authentication System — Oasis Infobyte Web Development Internship (Level 2, Task 4)
 * Author: Aman Kapuria
 *
 * Approach (A) from the task: front-end only, using HTML/CSS/JavaScript + localStorage.
 *
 * Data saved in localStorage:
 *   "oibsip-users"   -> list of users: { username, email, salt, passwordHash, createdAt }
 *   "oibsip-session" -> the logged-in user: { username, loginAt }
 *
 * Passwords are NEVER stored as plain text. Each password is mixed with a random
 * "salt" and then hashed with SHA-256 using the browser's built-in Web Crypto API.
 */

const USERS_KEY = "oibsip-users";
const SESSION_KEY = "oibsip-session";

/* ---------- Storage helpers ---------- */

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  const users = readJSON(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

function saveUsers(users) {
  writeJSON(USERS_KEY, users);
}

/* ---------- Hashing ---------- */

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function makeSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function hashPassword(password, salt) {
  if (!window.crypto || !crypto.subtle) {
    throw new Error("NO_CRYPTO");
  }
  const data = new TextEncoder().encode(salt + ":" + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

/* ---------- Validation ---------- */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,20}$/;

function checkPasswordRules(password) {
  return {
    length: password.length >= 8,
    number: /\d/.test(password),
  };
}

function findUser(identifier) {
  const id = identifier.trim().toLowerCase();
  return getUsers().find(
    (u) => u.username.toLowerCase() === id || u.email.toLowerCase() === id
  );
}

/* ---------- Register / Login / Logout ---------- */

async function registerUser({ username, email, password }) {
  const users = getUsers();
  const nameTaken = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  const emailTaken = users.some((u) => u.email.toLowerCase() === email.toLowerCase());

  if (nameTaken) return { ok: false, field: "username", message: "This username is already taken." };
  if (emailTaken) return { ok: false, field: "email", message: "An account with this email already exists." };

  const salt = makeSalt();
  const passwordHash = await hashPassword(password, salt);

  users.push({ username, email: email.toLowerCase(), salt, passwordHash, createdAt: Date.now() });
  saveUsers(users);
  return { ok: true };
}

async function loginUser(identifier, password) {
  const user = findUser(identifier);
  // Same message whether the user is unknown or the password is wrong,
  // so an attacker can't tell which part was incorrect.
  const genericError = { ok: false, message: "Invalid username/email or password." };
  if (!user) return genericError;

  const attemptHash = await hashPassword(password, user.salt);
  if (attemptHash !== user.passwordHash) return genericError;

  writeJSON(SESSION_KEY, { username: user.username, loginAt: Date.now() });
  return { ok: true };
}

function getSession() {
  const session = readJSON(SESSION_KEY, null);
  if (!session || !session.username) return null;
  // Make sure the user in the session still exists
  return findUser(session.username) ? session : null;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace("index.html");
}

/* ---------- Small UI helpers shared by the pages ---------- */

function setFieldError(input, message) {
  const field = input.closest(".field");
  const errorEl = field.querySelector(".field-error");
  field.classList.toggle("invalid", Boolean(message));
  errorEl.textContent = message || "";
}

function showAlert(el, message, type = "error") {
  el.textContent = message;
  el.className = `alert ${type}`;
  el.hidden = !message;
}

// Show / hide password buttons
document.querySelectorAll(".toggle-pass").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn.parentElement.querySelector("input");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "Hide" : "Show";
  });
});
