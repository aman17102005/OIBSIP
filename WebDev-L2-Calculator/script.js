/*
 * Calculator — Oasis Infobyte Web Development Internship (Level 2, Task 1)
 * Author: Aman Kapuria
 *
 * How it works (no eval() is used anywhere):
 *  - Everything the user types is stored in an array called `tokens`.
 *    Example: 5 + 3 × 2  ->  ["5", "+", "3", "×", "2"]
 *  - When "=" is pressed, calculate() solves it in two passes:
 *      pass 1: × and ÷   (they come first, like in maths)
 *      pass 2: + and −
 *    So 5 + 3 × 2 gives 11, and you never need to reset between operations.
 */

const OPERATORS = ["+", "−", "×", "÷"];
const MAX_DIGITS = 15;

const expressionEl = document.getElementById("expression");
const resultEl = document.getElementById("result");

let tokens = [];           // the expression being built
let justCalculated = false; // true right after "=" is pressed
let hasError = false;       // true while an error message is showing

/* ---------- Small helpers ---------- */

const isOperator = (t) => OPERATORS.includes(t);
const lastToken = () => tokens[tokens.length - 1];

// Clean up long decimals like 0.1 + 0.2 = 0.30000000000000004
function formatNumber(num) {
  if (!isFinite(num)) return "Error";
  const rounded = parseFloat(num.toPrecision(12));
  return String(rounded);
}

/* ---------- The maths (no eval) ---------- */

function applyOperator(a, operator, b) {
  switch (operator) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      if (b === 0) throw new Error("DIVIDE_BY_ZERO");
      return a / b;
    default:
      throw new Error("UNKNOWN_OPERATOR");
  }
}

function calculate(list) {
  // Turn number strings into real numbers
  const items = list.map((t) => (isOperator(t) ? t : parseFloat(t)));

  // Pass 1: multiplication and division
  const firstPass = [items[0]];
  for (let i = 1; i < items.length; i += 2) {
    const operator = items[i];
    const next = items[i + 1];
    if (operator === "×" || operator === "÷") {
      const prev = firstPass.pop();
      firstPass.push(applyOperator(prev, operator, next));
    } else {
      firstPass.push(operator, next);
    }
  }

  // Pass 2: addition and subtraction (left to right)
  let total = firstPass[0];
  for (let i = 1; i < firstPass.length; i += 2) {
    total = applyOperator(total, firstPass[i], firstPass[i + 1]);
  }
  return total;
}

/* ---------- Updating the screen ---------- */

function updateDisplay(mainText) {
  expressionEl.textContent = tokens.join(" ");
  resultEl.classList.remove("error");

  if (mainText !== undefined) {
    resultEl.textContent = mainText;
  } else {
    const last = lastToken();
    resultEl.textContent = last && !isOperator(last) ? last : previewResult();
  }

  resultEl.classList.toggle("small", resultEl.textContent.length > 11);
  highlightOperator();
}

// Shows the running answer while typing (for example "5 + 3 ×" shows 8)
function previewResult() {
  const usable = isOperator(lastToken()) ? tokens.slice(0, -1) : tokens;
  if (usable.length === 0) return "0";
  try {
    return formatNumber(calculate(usable));
  } catch {
    return "0";
  }
}

function highlightOperator() {
  document.querySelectorAll(".key.op").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.operator === lastToken());
  });
}

function showError(message) {
  hasError = true;
  tokens = [];
  expressionEl.textContent = "";
  resultEl.textContent = message;
  resultEl.classList.add("error");
  resultEl.classList.remove("small");
  highlightOperator();
}

// After an error or a finished answer, the next number starts fresh
function startFreshIfNeeded() {
  if (hasError || justCalculated) {
    tokens = [];
    hasError = false;
    justCalculated = false;
  }
}

/* ---------- Button actions ---------- */

function inputNumber(digit) {
  startFreshIfNeeded();
  const last = lastToken();

  if (last === undefined || isOperator(last)) {
    tokens.push(digit);
  } else if (last === "0") {
    tokens[tokens.length - 1] = digit; // no leading zeros like "007"
  } else if (last.replace(/[-.]/g, "").length < MAX_DIGITS) {
    tokens[tokens.length - 1] = last + digit;
  }
  updateDisplay();
}

function inputDecimal() {
  startFreshIfNeeded();
  const last = lastToken();

  if (last === undefined || isOperator(last)) {
    tokens.push("0.");
  } else if (!last.includes(".")) {
    tokens[tokens.length - 1] = last + ".";
  }
  updateDisplay();
}

function inputOperator(operator) {
  if (hasError) {
    hasError = false;
    tokens = ["0"];
  }
  justCalculated = false; // keep the answer and carry on with it (chaining)

  if (tokens.length === 0) tokens.push("0");

  const last = lastToken();
  if (isOperator(last)) {
    tokens[tokens.length - 1] = operator; // swap operator if pressed twice
  } else {
    if (last.endsWith(".")) tokens[tokens.length - 1] = last.slice(0, -1);
    tokens.push(operator);
  }
  updateDisplay();
}

function inputPercent() {
  const last = lastToken();
  if (hasError || last === undefined || isOperator(last)) return;
  tokens[tokens.length - 1] = formatNumber(parseFloat(last) / 100);
  justCalculated = false;
  updateDisplay();
}

function backspace() {
  if (hasError) return clearAll();
  if (justCalculated) {
    justCalculated = false; // edit the answer like a normal number
  }
  const last = lastToken();
  if (last === undefined) return updateDisplay();

  const shorter = isOperator(last) ? "" : last.slice(0, -1);
  if (shorter === "" || shorter === "-") {
    tokens.pop();
  } else {
    tokens[tokens.length - 1] = shorter;
  }
  updateDisplay();
}

function clearAll() {
  tokens = [];
  hasError = false;
  justCalculated = false;
  updateDisplay("0");
}

function equals() {
  if (hasError || tokens.length === 0) return;
  if (isOperator(lastToken())) tokens.pop(); // ignore a trailing operator
  if (tokens.length === 0) return updateDisplay("0");

  const fullExpression = tokens.join(" ");
  try {
    const answer = formatNumber(calculate(tokens));
    if (answer === "Error") return showError("Error: number too large");
    tokens = [answer];
    justCalculated = true;
    updateDisplay(answer);
    expressionEl.textContent = fullExpression + " =";
  } catch (err) {
    if (err.message === "DIVIDE_BY_ZERO") {
      showError("Error: can't divide by zero");
    } else {
      showError("Error");
    }
  }
}

/* ---------- Event listeners (no inline onclick in the HTML) ---------- */

document.querySelectorAll(".key").forEach((button) => {
  button.addEventListener("click", () => {
    const { number, operator, action } = button.dataset;

    if (number !== undefined) return inputNumber(number);
    if (operator !== undefined) return inputOperator(operator);

    switch (action) {
      case "decimal":
        return inputDecimal();
      case "clear":
        return clearAll();
      case "backspace":
        return backspace();
      case "percent":
        return inputPercent();
      case "equals":
        return equals();
    }
  });
});

// Bonus: keyboard support
const keyMap = {
  "+": "+",
  "-": "−",
  "*": "×",
  x: "×",
  "/": "÷",
};

document.addEventListener("keydown", (event) => {
  const { key } = event;
  let button = null;

  if (/^[0-9]$/.test(key)) button = document.querySelector(`[data-number="${key}"]`);
  else if (keyMap[key]) button = document.querySelector(`[data-operator="${keyMap[key]}"]`);
  else if (key === "." || key === ",") button = document.querySelector('[data-action="decimal"]');
  else if (key === "Enter" || key === "=") button = document.querySelector('[data-action="equals"]');
  else if (key === "Backspace") button = document.querySelector('[data-action="backspace"]');
  else if (key === "Escape" || key.toLowerCase() === "c") button = document.querySelector('[data-action="clear"]');
  else if (key === "%") button = document.querySelector('[data-action="percent"]');

  if (button) {
    event.preventDefault();
    button.click();
    button.classList.add("pressed");
    setTimeout(() => button.classList.remove("pressed"), 100);
  }
});

updateDisplay("0");
