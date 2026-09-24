# Tiến độ & việc còn lại

## Đã xong
- Code hoàn chỉnh: `src/clickup.js`, `categorize.js`, `format.js`, `send.js`, `config.js`, `index.js`
- Business logic đã chốt (xem comment trong `src/config.js`):
  - Loại trừ hẳn task có `custom_item_id` thuộc `EXCLUDED_CUSTOM_ITEM_IDS` (User Story/Epic/Milestone)
  - Bỏ qua task chưa triage (không assignee + không due date)
  - "Thiếu công số"/"thiếu tracking"/"resolved thiếu comment-công số" chỉ áp dụng cho task có `status.status` literal = "resolved" (không tính "complete")
  - "Quá hạn" loại trừ theo `status.type` (FINISHED_STATUS_TYPES = done/closed)
- Đã bỏ dự án "Internal TKS-BIG" khỏi `config.js` — còn 4 dự án:
  1. Plan-B_Gyomu Kaizen(業務改善) → `TEAMS_FLOW_URL_1`
  2. Plan-B_CM Agent → `TEAMS_FLOW_URL_2`
  3. Plan-B_Ragoon → `TEAMS_FLOW_URL_3`
  4. TRE-Maintainance → `TEAMS_FLOW_URL_4`
- `format.js` đã sửa dùng HTML (`<br>` xuống dòng) vì action Teams nhận nội dung dạng HTML, `\n` không xuống dòng được
- **Đã đổi format dòng task** (2026-09-24): bỏ bullet `•` và link ClickUp, mỗi dòng task giờ là `Tên task - tên assignee` (lấy thẳng `username` từ ClickUp, không mapping honorific/đảo tên). Section 0 task kết thúc bằng dấu `.`, section có task kết thúc bằng dấu `:` rồi liệt kê từng dòng bên dưới. Đây chỉ là text thường, KHÔNG phải mention thật (không notify ai) — quyết định vì tin nhắn giờ chỉ gửi cho một mình bạn xem.
- **Đã đổi đích gửi**: thay vì bắn vào channel riêng của từng project, cả 4 flow giờ gửi vào **chat cá nhân giữa bạn (Phú Phạm Gia) và Flow bot**. Trong action "Post message in a chat or channel": đổi "Post in" từ Channel → **Chat with Flow bot**, rồi chọn đúng tên bạn trong dropdown "Chat with Flow bot". **Flow project 1 (Plan-B_Gyomu Kaizen) đã build xong theo recipe cũ (gửi vào channel) — cần vào sửa lại action này để đổi sang chat cá nhân**, không cần tạo lại từ đầu.

## Recipe tạo flow Power Automate (áp dụng cho 3 dự án còn lại)
Rút kinh nghiệm từ các lỗi đã gặp khi làm project 1:

1. Tạo **Instant cloud flow**, trigger **"When a HTTP request is received"**
2. **Tắt toggle "New designer"** trước khi thêm trigger — nếu để bật, trigger tạo ra kiểu "manual" mới dùng Direct API cần OAuth, POST thường sẽ bị lỗi 401 `DirectApiAuthorizationRequired`
3. Dán schema mẫu `{"project": "string", "message": "string"}` vào "Use sample payload to generate schema"
4. Field **"Who can trigger the flow?"** phải chọn **"Anyone"** (không để "Any user in my tenant" — sẽ bị 401 vì cần OAuth)
5. Thêm action Teams **"Post message in a chat or channel"**:
   - Post as: Flow bot
   - Post in: **Chat with Flow bot** (gửi vào chat cá nhân — đích hiện tại là gửi hết về cho bạn xem, không gửi vào channel project nữa)
   - Ở field chọn người, gõ và chọn đúng tên bạn (Phú Phạm Gia) từ dropdown xổ xuống, không gõ tay — tương tự lỗi `channelId is not valid` khi trước, chọn sai/chưa load xong dropdown sẽ lưu sai ID
   - Message: xoá mọi dynamic content mặc định, chèn đúng token **`message`** (không phải `Body` — `Body` là nguyên JSON thô)
6. Save → mở lại trigger, copy **HTTP POST URL** (phải có `&sig=...` ở cuối, đó là URL ẩn danh dùng được)
7. Dán URL vào đúng biến trong `.env` để test: `node --env-file=.env src/index.js` (nhớ `unset CLICKUP_API_TOKEN` trước nếu shell có biến cũ)
8. Nếu chạy xong mà không thấy tin nhắn: vào flow → **28-day run history** → xem run mới nhất Failed/Succeeded, bấm vào run Failed để xem lỗi cụ thể

## Việc còn lại (theo thứ tự)
1. Sửa action Teams của flow project 1 (Plan-B_Gyomu Kaizen): đổi "Post in" từ Channel → Chat with Flow bot, chọn tên bạn
2. Lặp lại recipe trên (đã cập nhật đích gửi = chat cá nhân) cho 3 flow còn lại: Plan-B_CM Agent, Plan-B_Ragoon, TRE-Maintainance
3. Điền 4 URL thật vào `.env` để test full 1 lần (không dùng webhook.site nữa) — kiểm tra format mới (không link, có tên assignee) hiển thị đúng trong chat cá nhân
4. Tạo GitHub repo (private), push code (xem README.md mục 4)
5. Thêm 5 GitHub Secrets: `CLICKUP_API_TOKEN`, `TEAMS_FLOW_URL_1..4` (README mục 5)
6. Test bằng nút "Run workflow" (workflow_dispatch) trên tab Actions (README mục 6)
7. Sau khi ổn, để lịch cron tự chạy 9:30 & 16:00 giờ VN, Thứ 2 - Thứ 6 — không phụ thuộc máy nào bật

## Lưu ý khác
- `.env` hiện đang chứa `CLICKUP_API_TOKEN` thật — **không commit file này** (đã có trong `.gitignore`)
- Shell đôi khi có biến `CLICKUP_API_TOKEN` cũ dây vào — luôn `unset CLICKUP_API_TOKEN` trước khi chạy `node --env-file=.env src/index.js` để tránh lỗi 401 token invalid
