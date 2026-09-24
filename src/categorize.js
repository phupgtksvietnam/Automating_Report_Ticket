import {
  EXCLUDED_CUSTOM_ITEM_IDS,
  USER_STORY_CUSTOM_ITEM_ID,
  EFFORT_FIELD_NAME,
  TRACKING_FIELD_NAME,
  FINISHED_STATUS_TYPES,
  EFFORT_CHECK_STATUS_NAME,
  TIMEZONE_OFFSET_HOURS,
  TRACKING_MIN_DUE_DATE_ISO,
} from "./config.js";
import { fetchCommentCount } from "./clickup.js";

const TRACKING_CUTOFF_MS = new Date(TRACKING_MIN_DUE_DATE_ISO).getTime();

// User Story chỉ loại trừ khi nó THỰC SỰ có task con (đang dùng đúng vai trò container).
// Không có task con nào thì coi như task bình thường, vẫn tính vào báo cáo.
function isExcludedType(task, parentIds) {
  if (task.custom_item_id === USER_STORY_CUSTOM_ITEM_ID) {
    return parentIds.has(task.id);
  }
  return EXCLUDED_CUSTOM_ITEM_IDS.includes(task.custom_item_id);
}

// Task chưa được triage (không assignee và không due date) thì bỏ qua hoàn toàn.
function isUntriaged(task) {
  const noAssignee = !task.assignees || task.assignees.length === 0;
  const noDueDate = !task.due_date;
  return noAssignee && noDueDate;
}

// Dùng để loại trừ khỏi "quá hạn due date" (status.type, gộp cả resolved lẫn complete).
function isFinished(task) {
  return FINISHED_STATUS_TYPES.includes(task.status?.type);
}

// Chỉ task có status literal "resolved" mới cần kiểm tra đủ công số/tracking/comment.
function statusRequiresEffortCheck(task) {
  return task.status?.status?.trim().toLowerCase() === EFFORT_CHECK_STATUS_NAME;
}

function vnDateKey(epochMs) {
  const shifted = new Date(epochMs + TIMEZONE_OFFSET_HOURS * 3600 * 1000);
  return `${shifted.getUTCFullYear()}-${shifted.getUTCMonth()}-${shifted.getUTCDate()}`;
}

// Mốc 00:00 giờ VN của ngày chứa epochMs, dùng để so sánh "trước/sau ngày" đúng theo
// lịch thay vì theo mốc giờ chính xác (tránh task due hôm nay nhưng giờ đã trôi qua
// bị tính nhầm thành "quá hạn").
function vnStartOfDayMs(epochMs) {
  const shifted = new Date(epochMs + TIMEZONE_OFFSET_HOURS * 3600 * 1000);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  return Date.UTC(y, m, d) - TIMEZONE_OFFSET_HOURS * 3600 * 1000;
}

function getCustomFieldValue(task, fieldName) {
  const field = (task.custom_fields || []).find(
    (f) => f.name && f.name.trim().toLowerCase() === fieldName
  );
  return field ? field.value : undefined;
}

function isEmptyFieldValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return value <= 0;
  return false;
}

function isMissingEffort(task) {
  return isEmptyFieldValue(getCustomFieldValue(task, EFFORT_FIELD_NAME));
}

function isMissingTracking(task) {
  return isEmptyFieldValue(getCustomFieldValue(task, TRACKING_FIELD_NAME));
}

export async function categorizeTasks(tasks, clickupToken) {
  const result = {
    overdue: [],
    dueToday: [],
    missingEffort: [],
    missingTracking: [],
    resolvedIncomplete: [],
  };

  const now = Date.now();
  const todayKey = vnDateKey(now);

  const parentIds = new Set(tasks.filter((t) => t.parent).map((t) => t.parent));
  const relevant = tasks.filter((t) => !isExcludedType(t, parentIds) && !isUntriaged(t));

  for (const task of relevant) {
    const finished = isFinished(task);
    const needsEffortCheck = statusRequiresEffortCheck(task);
    const dueDate = task.due_date ? Number(task.due_date) : null;
    const missingEffort = needsEffortCheck && isMissingEffort(task);
    const trackingApplies = dueDate !== null && dueDate >= TRACKING_CUTOFF_MS;
    const missingTracking = needsEffortCheck && trackingApplies && isMissingTracking(task);

    if (dueDate) {
      if (!finished && vnStartOfDayMs(dueDate) < vnStartOfDayMs(now)) result.overdue.push(task);
      if (vnDateKey(dueDate) === todayKey) result.dueToday.push(task);
    }
    if (missingEffort) result.missingEffort.push(task);
    if (missingTracking) result.missingTracking.push(task);

    if (needsEffortCheck) {
      const commentCount = await fetchCommentCount(task.id, clickupToken);
      if (commentCount === 0 || missingEffort || missingTracking) {
        result.resolvedIncomplete.push(task);
      }
    }
  }

  return result;
}
