export async function sendToTeams(webhookUrl, projectName, message) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: projectName, message }),
  });
  if (!res.ok) {
    throw new Error(`Gửi Teams thất bại cho "${projectName}": ${res.status} ${await res.text()}`);
  }
}
