import { sideBySideRows } from "./diff.js";

const elements = {
  app: document.querySelector("#app"),
  loading: document.querySelector("#loading"),
  runMeta: document.querySelector("#run-meta"),
  summaryCards: document.querySelector("#summary-cards"),
  search: document.querySelector("#search"),
  filter: document.querySelector("#filter"),
  sort: document.querySelector("#sort"),
  caseCount: document.querySelector("#case-count"),
  caseList: document.querySelector("#case-list"),
  previous: document.querySelector("#previous"),
  next: document.querySelector("#next"),
  caseTitle: document.querySelector("#case-title"),
  casePath: document.querySelector("#case-path"),
  caseBadges: document.querySelector("#case-badges"),
  profile: document.querySelector("#profile"),
  comparison: document.querySelector("#comparison"),
  changesOnly: document.querySelector("#changes-only"),
  diagnostics: document.querySelector("#diagnostics"),
  metrics: document.querySelector("#metrics"),
  leftHeading: document.querySelector("#left-heading"),
  rightHeading: document.querySelector("#right-heading"),
  diff: document.querySelector("#diff"),
  decisionButtons: document.querySelector("#decision-buttons"),
  notes: document.querySelector("#notes"),
  saveState: document.querySelector("#save-state"),
  exportReview: document.querySelector("#export-review"),
  importReview: document.querySelector("#import-review"),
};

const detailCache = new Map();
let summary;
let visibleCases = [];
let activeCaseId = null;
let activeDetail = null;
let reviewState = {};
let storageKey = "";
let notesTimer;

function profileResult(entry) {
  const profileId = elements.profile.value || summary.profiles[0].id;
  return entry.profiles[profileId] ?? Object.values(entry.profiles)[0];
}

function currentReview(caseId = activeCaseId) {
  return reviewState[caseId] ?? { decision: "unreviewed", notes: "" };
}

function saveReviews(message = "Saved locally") {
  localStorage.setItem(storageKey, JSON.stringify(reviewState));
  elements.saveState.textContent = message;
  window.setTimeout(() => {
    if (elements.saveState.textContent === message) elements.saveState.textContent = "";
  }, 1800);
}

function selectedProfileId() {
  return elements.profile.value || summary.profiles[0].id;
}

function decisionLabel(decision) {
  return {
    "looks-good": "Looks reasonable",
    "possible-bug": "Possible bug",
    "expected-deviation": "Expected deviation",
    duplicate: "Duplicate",
    unreviewed: "Unreviewed",
  }[decision];
}

function makeBadge(label, kind = "neutral") {
  const badge = document.createElement("span");
  badge.className = `badge ${kind}`;
  badge.textContent = label;
  return badge;
}

function renderSummary() {
  const reviewed = Object.values(reviewState).filter(
    (entry) => entry.decision && entry.decision !== "unreviewed",
  ).length;
  const activeResults = summary.cases.map(profileResult);
  const cards = [
    [summary.counts.cases, "cases"],
    [activeResults.filter((result) => result.hardFailure).length, "hard failures"],
    [
      activeResults.filter((result) =>
        result.diagnostics.some((diagnostic) => diagnostic.level === "warning"),
      ).length,
      "warnings",
    ],
    [reviewed, "reviewed"],
  ];
  elements.summaryCards.replaceChildren(
    ...cards.map(([value, label]) => {
      const card = document.createElement("div");
      card.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
      return card;
    }),
  );
}

function caseMatchesFilter(entry) {
  const query = elements.search.value.trim().toLocaleLowerCase();
  if (
    query &&
    !entry.name.toLocaleLowerCase().includes(query) &&
    !entry.sourcePath.toLocaleLowerCase().includes(query)
  ) {
    return false;
  }

  const result = profileResult(entry);
  const review = currentReview(entry.id);
  switch (elements.filter.value) {
    case "unreviewed":
      return !review.decision || review.decision === "unreviewed";
    case "possible-bug":
      return review.decision === "possible-bug";
    case "hard-failure":
      return result.hardFailure;
    case "warning":
      return result.diagnostics.some((diagnostic) => diagnostic.level === "warning");
    case "duplicate":
      return entry.duplicateFixtures.length > 0;
    default:
      return true;
  }
}

function sortCases(entries) {
  return entries.sort((left, right) => {
    if (elements.sort.value === "path") return left.sourcePath.localeCompare(right.sourcePath);
    const leftResult = profileResult(left);
    const rightResult = profileResult(right);
    if (elements.sort.value === "change") {
      return (
        rightResult.metrics.versusV2.changedLineRatio -
          leftResult.metrics.versusV2.changedLineRatio ||
        left.sourcePath.localeCompare(right.sourcePath)
      );
    }
    return (
      rightResult.priorityScore - leftResult.priorityScore ||
      left.sourcePath.localeCompare(right.sourcePath)
    );
  });
}

function renderCaseList({ keepSelection = true } = {}) {
  visibleCases = sortCases(summary.cases.filter(caseMatchesFilter));
  elements.caseCount.textContent = `${visibleCases.length} of ${summary.cases.length} cases`;
  const fragment = document.createDocumentFragment();

  for (const entry of visibleCases) {
    const result = profileResult(entry);
    const review = currentReview(entry.id);
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "case-item";
    button.dataset.caseId = entry.id;
    if (entry.id === activeCaseId) {
      button.classList.add("active");
      button.setAttribute("aria-current", "true");
    }

    const status = result.hardFailure
      ? "failure"
      : review.decision === "possible-bug"
        ? "possible"
        : review.decision && review.decision !== "unreviewed"
          ? "reviewed"
          : "unreviewed";
    button.innerHTML = `
      <span class="case-status ${status}" aria-hidden="true"></span>
      <span class="case-copy">
        <strong>${entry.name}</strong>
        <small>${entry.group} · score ${result.priorityScore}</small>
      </span>`;
    button.addEventListener("click", () => selectCase(entry.id));
    item.append(button);
    fragment.append(item);
  }

  elements.caseList.replaceChildren(fragment);

  if (!keepSelection || !visibleCases.some((entry) => entry.id === activeCaseId)) {
    const nextId = visibleCases[0]?.id ?? null;
    if (nextId) {
      void selectCase(nextId);
    } else {
      activeCaseId = null;
      activeDetail = null;
      elements.caseTitle.textContent = "No cases match this filter";
      elements.casePath.textContent = "Adjust the search or filter to continue reviewing.";
      elements.caseBadges.replaceChildren();
      elements.diagnostics.replaceChildren();
      elements.metrics.replaceChildren();
      elements.diff.innerHTML = '<div class="empty-diff">No matching cases.</div>';
    }
  }
  updateNavigation();
}

function updateNavigation() {
  const index = visibleCases.findIndex((entry) => entry.id === activeCaseId);
  elements.previous.disabled = index <= 0;
  elements.next.disabled = index === -1 || index >= visibleCases.length - 1;
}

function comparisonContent() {
  const result = activeDetail.profiles[selectedProfileId()];
  if (elements.comparison.value === "input-v3") {
    return {
      left: activeDetail.input,
      right: result.output,
      leftLabel: "Original v2 input",
      rightLabel: "v3 formatted output",
    };
  }
  if (elements.comparison.value === "input-v2") {
    return {
      left: activeDetail.input,
      right: activeDetail.reference,
      leftLabel: "Original v2 input",
      rightLabel: "v2 output (with Pint)",
    };
  }
  return {
    left: activeDetail.reference,
    right: result.output,
    leftLabel: "v2 output (with Pint)",
    rightLabel: "v3 formatted output",
  };
}

function cellContent(cell, side) {
  const wrapper = document.createElement("div");
  wrapper.className = `diff-cell ${side}`;
  const number = document.createElement("span");
  number.className = "line-number";
  number.textContent = cell?.number ?? "";
  const code = document.createElement("code");
  code.textContent = cell?.text ?? "";
  wrapper.append(number, code);
  return wrapper;
}

function rowsWithContext(rows, context = 3) {
  if (!elements.changesOnly.checked) return rows.map((row) => ({ type: "row", row }));
  const visible = new Set();
  rows.forEach((row, index) => {
    if (row.kind === "equal") return;
    for (let offset = -context; offset <= context; offset++) {
      if (index + offset >= 0 && index + offset < rows.length) visible.add(index + offset);
    }
  });

  const result = [];
  let previous = -2;
  for (const index of [...visible].sort((a, b) => a - b)) {
    if (index > previous + 1) result.push({ type: "gap" });
    result.push({ type: "row", row: rows[index] });
    previous = index;
  }
  return result;
}

function renderDiff() {
  if (!activeDetail) return;
  const comparison = comparisonContent();
  elements.leftHeading.textContent = comparison.leftLabel;
  elements.rightHeading.textContent = comparison.rightLabel;
  const rows = rowsWithContext(sideBySideRows(comparison.left, comparison.right));
  const fragment = document.createDocumentFragment();

  if (rows.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-diff";
    empty.textContent = elements.changesOnly.checked
      ? "No changed lines in this comparison."
      : "Both files are empty.";
    fragment.append(empty);
  }

  for (const entry of rows) {
    if (entry.type === "gap") {
      const gap = document.createElement("div");
      gap.className = "diff-gap";
      gap.textContent = "Unchanged lines hidden";
      fragment.append(gap);
      continue;
    }
    const row = document.createElement("div");
    row.className = `diff-row ${entry.row.kind}`;
    row.append(cellContent(entry.row.left, "left"), cellContent(entry.row.right, "right"));
    fragment.append(row);
  }
  elements.diff.replaceChildren(fragment);
}

function renderDiagnostics(result) {
  if (result.diagnostics.length === 0) {
    elements.diagnostics.innerHTML =
      '<div class="diagnostic success">No mechanical warnings.</div>';
    return;
  }
  elements.diagnostics.replaceChildren(
    ...result.diagnostics.map((entry) => {
      const diagnostic = document.createElement("div");
      diagnostic.className = `diagnostic ${entry.level}`;
      diagnostic.innerHTML = `<strong>${entry.code}</strong><span></span>`;
      diagnostic.querySelector("span").textContent = entry.message;
      return diagnostic;
    }),
  );
}

function renderMetrics(result) {
  const values = [
    ["v2/v3 changed lines", `${(result.metrics.versusV2.changedLineRatio * 100).toFixed(1)}%`],
    [
      "input/v3 changed lines",
      `${(result.metrics.versusInput.changedLineRatio * 100).toFixed(1)}%`,
    ],
    ["convergence", result.convergedAt ? `pass ${result.convergedAt}` : "not reached"],
    ["format time", `${result.elapsedMs} ms`],
    ["v3 max indent", `${result.metrics.outputMaxIndent} columns`],
  ];
  elements.metrics.replaceChildren(
    ...values.map(([label, value]) => {
      const metric = document.createElement("div");
      metric.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      return metric;
    }),
  );
}

function renderDecision() {
  const review = currentReview();
  for (const button of elements.decisionButtons.querySelectorAll("button")) {
    const active = button.dataset.decision === review.decision;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  elements.notes.value = review.notes ?? "";
}

function renderActiveCase() {
  if (!activeDetail) return;
  const result = activeDetail.profiles[selectedProfileId()];
  const review = currentReview();
  elements.caseTitle.textContent = activeDetail.name;
  elements.casePath.textContent = activeDetail.sourcePath;
  const badges = [];
  badges.push(makeBadge(`score ${result.priorityScore}`));
  badges.push(
    result.hardFailure
      ? makeBadge("hard failure", "danger")
      : makeBadge(
          `converged ${result.convergedAt ? `pass ${result.convergedAt}` : "unknown"}`,
          "success",
        ),
  );
  if (activeDetail.duplicateFixtures.length > 0) {
    badges.push(makeBadge("existing fixture", "info"));
  }
  if (review.decision && review.decision !== "unreviewed") {
    badges.push(
      makeBadge(
        decisionLabel(review.decision),
        review.decision === "possible-bug" ? "danger" : "info",
      ),
    );
  }
  elements.caseBadges.replaceChildren(...badges);
  renderDiagnostics(result);
  renderMetrics(result);
  renderDiff();
  renderDecision();
  updateNavigation();
}

async function selectCase(caseId) {
  activeCaseId = caseId;
  for (const button of elements.caseList.querySelectorAll(".case-item")) {
    const active = button.dataset.caseId === caseId;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  }
  elements.diff.innerHTML = '<div class="empty-diff">Loading case…</div>';
  try {
    if (!detailCache.has(caseId)) {
      const response = await fetch(`./data/cases/${caseId}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      detailCache.set(caseId, await response.json());
    }
    if (activeCaseId !== caseId) return;
    activeDetail = detailCache.get(caseId);
    renderActiveCase();
  } catch (error) {
    elements.diff.innerHTML = `<div class="empty-diff error">Unable to load case: ${error.message}</div>`;
  }
}

function moveSelection(offset) {
  const index = visibleCases.findIndex((entry) => entry.id === activeCaseId);
  const next = visibleCases[index + offset];
  if (next) void selectCase(next.id);
}

function setDecision(decision) {
  const previous = currentReview();
  reviewState[activeCaseId] = {
    ...previous,
    decision: previous.decision === decision ? "unreviewed" : decision,
    updatedAt: new Date().toISOString(),
  };
  saveReviews();
  renderDecision();
  renderSummary();
  renderCaseList();
  renderActiveCase();
}

function exportReviews() {
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    v2Commit: summary.v2.commit,
    v3Commit: summary.v3.commit,
    reviews: reviewState,
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `chisel-v2-v3-review-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importReviews(file) {
  const payload = JSON.parse(await file.text());
  if (payload.schemaVersion !== 1 || typeof payload.reviews !== "object") {
    throw new Error("Unsupported review file");
  }
  reviewState = { ...reviewState, ...payload.reviews };
  saveReviews("Imported and saved locally");
  renderSummary();
  renderCaseList();
  renderActiveCase();
}

function bindEvents() {
  for (const input of [elements.search, elements.filter, elements.sort]) {
    input.addEventListener(input === elements.search ? "input" : "change", () => renderCaseList());
  }
  elements.profile.addEventListener("change", () => {
    renderSummary();
    renderCaseList();
    renderActiveCase();
  });
  elements.comparison.addEventListener("change", renderDiff);
  elements.changesOnly.addEventListener("change", renderDiff);
  elements.previous.addEventListener("click", () => moveSelection(-1));
  elements.next.addEventListener("click", () => moveSelection(1));
  elements.decisionButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-decision]");
    if (button) setDecision(button.dataset.decision);
  });
  elements.notes.addEventListener("input", () => {
    window.clearTimeout(notesTimer);
    const caseId = activeCaseId;
    const notes = elements.notes.value;
    notesTimer = window.setTimeout(() => {
      reviewState[caseId] = {
        ...currentReview(caseId),
        notes,
        updatedAt: new Date().toISOString(),
      };
      saveReviews();
    }, 250);
  });
  elements.exportReview.addEventListener("click", exportReviews);
  elements.importReview.addEventListener("change", async () => {
    const file = elements.importReview.files[0];
    if (!file) return;
    try {
      await importReviews(file);
    } catch (error) {
      elements.saveState.textContent = `Import failed: ${error.message}`;
    } finally {
      elements.importReview.value = "";
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea, select")) return;
    if (event.key === "j") moveSelection(1);
    else if (event.key === "k") moveSelection(-1);
  });
}

async function initialize() {
  try {
    const response = await fetch("./data/summary.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    summary = await response.json();
    storageKey = `chisel-corpus-review:${summary.v2.commit}:${summary.v3.fingerprint}`;
    try {
      reviewState = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    } catch {
      reviewState = {};
    }

    elements.runMeta.innerHTML = `
      <span>v2 <code>${summary.v2.commit.slice(0, 8)}</code></span>
      <span>v3 <code>${summary.v3.commit.slice(0, 8)}${summary.v3.dirty ? " + local changes" : ""}</code></span>
      <span>${new Date(summary.generatedAt).toLocaleString()}</span>`;
    elements.profile.replaceChildren(
      ...summary.profiles.map((profile) => {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.label;
        return option;
      }),
    );
    renderSummary();
    bindEvents();
    elements.loading.hidden = true;
    elements.app.hidden = false;
    renderCaseList({ keepSelection: false });
  } catch (error) {
    elements.loading.classList.add("error");
    elements.loading.textContent = `Unable to load report: ${error.message}`;
  }
}

void initialize();
