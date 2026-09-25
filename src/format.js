function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function taskLine(task) {
  const names = (task.assignees || []).map((a) => escapeHtml(a.username)).join(", ");
  const status = task.status?.status ? escapeHtml(task.status.status) : "";
  const suffixParts = [names, status].filter(Boolean);
  const suffix = suffixParts.length ? ` - ${suffixParts.join(" - ")}` : "";
  return `&nbsp;&nbsp;${escapeHtml(task.name)}${suffix}`;
}

function section(count, label, tasks) {
  if (count === 0) {
    return `${count} task ${label}.`;
  }
  const lines = [`${count} task ${label}:`, ...tasks.map(taskLine)];
  return lines.join("<br>");
}

export function formatProjectReport(projectName, categories) {
  const { overdue, dueToday, missingEffort, missingTracking, resolvedIncomplete } = categories;

  const parts = [
    `📋 ${escapeHtml(projectName)}`,
    section(overdue.length, "chậm due date", overdue),
    section(dueToday.length, "due date hôm nay", dueToday),
    section(missingEffort.length, "thiếu công số", missingEffort),
    section(missingTracking.length, "thiếu tracking time", missingTracking),
    section(resolvedIncomplete.length, "resolved thiếu công số", resolvedIncomplete),
  ];

  return parts.join("<br>");
}
