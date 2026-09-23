function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function taskLine(task) {
  const url = task.url || `https://app.clickup.com/t/${task.id}`;
  return `&nbsp;&nbsp;• ${escapeHtml(task.name)} — <a href="${url}">${url}</a>`;
}

function section(count, label, tasks) {
  const lines = [`${count} task ${label}.`];
  if (count > 0) {
    lines.push(...tasks.map(taskLine));
  }
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
    section(resolvedIncomplete.length, "resolved thiếu comment/công số", resolvedIncomplete),
  ];

  return parts.join("<br>");
}
