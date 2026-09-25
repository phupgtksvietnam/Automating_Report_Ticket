// Điền List ID thực tế của từng dự án ClickUp (lấy từ URL khi mở List trên web ClickUp)
// và tên biến env chứa Power Automate Flow URL tương ứng (đã set trong GitHub Secrets).
export const PROJECTS = [
  { name: "Plan-B_Gyomu Kaizen(業務改善)", clickupListId: "901815051716", webhookEnvVar: "TEAMS_FLOW_URL_1" },
  { name: "Plan-B_CM Agent", clickupListId: "901819942348", webhookEnvVar: "TEAMS_FLOW_URL_2" },
  { name: "Plan-B_Ragoon", clickupListId: "1100770000001765", webhookEnvVar: "TEAMS_FLOW_URL_3" },
  { name: "TRE-Maintainance", clickupListId: "901813843583", webhookEnvVar: "TEAMS_FLOW_URL_4" },
];

// ClickUp Custom Task Types (task.custom_item_id) bị loại trừ hoàn toàn khỏi báo cáo.
// Xác định qua GET /team/{team_id}/custom_item — trong workspace TKS-WS (90181980925):
// 1 = Milestone, 1006 = Epic (luôn dùng để quản lý task con, loại trừ hoàn toàn).
export const EXCLUDED_CUSTOM_ITEM_IDS = [1, 1006];

// 1007 = User Story. Bình thường cũng dùng để quản lý task con bên trong nên loại trừ,
// nhưng nếu User Story đó KHÔNG có task con nào (đang được dùng như 1 task thật) thì
// vẫn tính vào báo cáo bình thường (xem hasSubtasks trong categorize.js).
export const USER_STORY_CUSTOM_ITEM_ID = 1007;

// Custom field dùng làm "công số" (effort dự kiến) và "tracking time" (effort thực tế).
// Xác nhận qua dữ liệu thật: các List không dùng time_estimate/time_spent mặc định của ClickUp.
export const EFFORT_FIELD_NAME = "estimated effort";
export const TRACKING_FIELD_NAME = "actual effort";

// status.type ClickUp coi là "đã xong" (dùng để loại trừ khỏi "quá hạn due date").
// Bao gồm cả status tên "resolved" (type=done) lẫn "complete" (type=closed).
export const FINISHED_STATUS_TYPES = ["done", "closed"];

// Tên status chính xác (task.status.status) mà việc kiểm tra "thiếu công số" /
// "thiếu tracking time" / "resolved thiếu comment-công số" áp dụng.
// Task ở "to do", "in progress", "done"(complete) thì KHÔNG cần đủ công số.
export const EFFORT_CHECK_STATUS_NAME = "resolved";

// Chỉ tính "thiếu tracking time" cho task có due date từ mốc này trở đi (giờ VN).
// Task due trước mốc này, hoặc không có due date, sẽ không bị tính vào category này.
export const TRACKING_MIN_DUE_DATE_ISO = "2026-09-14T00:00:00+07:00";

// Task chỉ được liệt vào "chậm due date" khi đang ở 1 trong các status này (chưa
// làm xong và cũng chưa qua bước review) — vd "in review" quá hạn thì không tính.
export const OVERDUE_ELIGIBLE_STATUS_NAMES = ["to do", "todo", "in progress"];

export const TIMEZONE_OFFSET_HOURS = 7; // giờ Việt Nam (UTC+7)
