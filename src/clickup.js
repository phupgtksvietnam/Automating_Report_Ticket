const API_BASE = "https://api.clickup.com/api/v2";

async function clickupRequest(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: token },
  });
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    return clickupRequest(path, token);
  }
  if (!res.ok) {
    throw new Error(`ClickUp API ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function fetchAllTasksForList(listId, token) {
  const tasks = [];
  let page = 0;
  for (;;) {
    const data = await clickupRequest(
      `/list/${listId}/task?include_closed=true&subtasks=true&page=${page}`,
      token
    );
    if (!data.tasks || data.tasks.length === 0) break;
    tasks.push(...data.tasks);
    if (data.last_page) break;
    page += 1;
  }
  return tasks;
}
