import { PROJECTS } from "./config.js";
import { fetchAllTasksForList } from "./clickup.js";
import { categorizeTasks } from "./categorize.js";
import { formatProjectReport } from "./format.js";
import { sendToTeams } from "./send.js";

const CLICKUP_TOKEN = process.env.CLICKUP_API_TOKEN;
if (!CLICKUP_TOKEN) {
  console.error("Thiếu biến môi trường CLICKUP_API_TOKEN");
  process.exit(1);
}

async function run() {
  let hadError = false;

  for (const project of PROJECTS) {
    const webhookUrl = process.env[project.webhookEnvVar];
    if (!webhookUrl) {
      console.error(`[${project.name}] Thiếu biến môi trường ${project.webhookEnvVar}, bỏ qua.`);
      hadError = true;
      continue;
    }
    if (project.clickupListId.startsWith("TODO_")) {
      console.error(`[${project.name}] Chưa điền clickupListId trong src/config.js, bỏ qua.`);
      hadError = true;
      continue;
    }

    try {
      console.log(`[${project.name}] Đang lấy task từ ClickUp List ${project.clickupListId}...`);
      const tasks = await fetchAllTasksForList(project.clickupListId, CLICKUP_TOKEN);

      console.log(`[${project.name}] Lấy được ${tasks.length} task, đang phân loại...`);
      const categories = await categorizeTasks(tasks, CLICKUP_TOKEN);

      const message = formatProjectReport(project.name, categories);
      console.log(`[${project.name}] Nội dung báo cáo:\n${message}\n`);

      await sendToTeams(webhookUrl, project.name, message);
      console.log(`[${project.name}] Đã gửi vào Teams.`);
    } catch (err) {
      console.error(`[${project.name}] Lỗi: ${err.message}`);
      hadError = true;
    }
  }

  if (hadError) process.exit(1);
}

run();
