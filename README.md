# ClickUp → Microsoft Teams Reporter

Lấy task từ 4 dự án ClickUp, phân loại (quá hạn / due hôm nay / thiếu công số / thiếu tracking time / resolved thiếu comment-công số), và gửi báo cáo riêng vào 4 kênh Teams tương ứng — chạy tự động qua GitHub Actions, ~9:23 sáng và ~15:47 chiều giờ VN, Thứ 2 - Thứ 6.

## 1. Danh sách dự án / List ID ClickUp

Đã điền sẵn trong `src/config.js` (4 dự án, không còn "Internal TKS-BIG"). Nếu cần đổi List ID: mở List trên web ClickUp, xem URL dạng `https://app.clickup.com/{team_id}/v/li/{list_id}` — số cuối chính là List ID.

Nếu tên custom field "Estimated Effort"/"Actual Effort" hoặc tên status "resolved" trong dự án bạn khác, chỉnh trong `src/config.js`:
- `EFFORT_FIELD_NAME`, `TRACKING_FIELD_NAME`
- `EXCLUDED_CUSTOM_ITEM_IDS`
- `FINISHED_STATUS_TYPES`, `EFFORT_CHECK_STATUS_NAME`

## 2. Test local trước khi đẩy lên GitHub

```bash
cp .env.example .env
# điền CLICKUP_API_TOKEN thật + ít nhất 1 TEAMS_FLOW_URL để test
node src/index.js
```

Lấy `CLICKUP_API_TOKEN` tại ClickUp → Settings → Apps → API Token (personal token, dạng `pk_...`).

## 3. Tạo Power Automate Flow cho mỗi kênh Teams (làm 4 lần, mỗi kênh 1 flow)

Đây là bước phải làm thủ công trên web Microsoft (đăng nhập tài khoản M365 của bạn) — mình không có quyền truy cập tenant Power Automate của bạn nên không thể tạo hộ, nhưng làm theo đúng các bước này thì mỗi flow chỉ mất khoảng 2 phút:

1. Vào https://make.powerautomate.com → **+ Create** → **Instant cloud flow** → đặt tên (vd: `ClickUp Report - Plan-B_Gyomu Kaizen`) → chọn trigger **"When a HTTP request is received"** → **Create**
2. Trong bước trigger, bấm **"Use sample payload to generate schema"**, dán:
   ```json
   {"project": "string", "message": "string"}
   ```
   → **Done**, ClickUp sẽ sinh JSON Schema tương ứng.
3. Bấm **+ New step** → tìm connector **Microsoft Teams** → chọn action **"Post message in a chat or channel"**:
   - Post as: **Flow bot**
   - Post in: có 2 lựa chọn, tuỳ đích đến của dự án đó là gì:
     - **Nếu là kênh (Channel) trong 1 Team**: chọn **"Channel"** → hiện thêm 2 dropdown **Team** (chọn Team chứa kênh) và **Channel** (chọn đúng kênh)
     - **Nếu là đoạn chat nhóm (group chat, không nằm trong Team nào)**: chọn **"Group chat"** → hiện dropdown **Group chat** liệt kê các đoạn chat nhóm mà tài khoản đang đăng nhập Power Automate là thành viên — chọn đúng đoạn chat của dự án đó (nếu không thấy trong danh sách, nghĩa là tài khoản bạn dùng để tạo flow chưa ở trong group chat đó — cần được thêm vào group chat trước)
   - Message: bấm vào ô, chọn tab **Dynamic content**, chèn field `message` (từ trigger) — có thể thêm `project` phía trên nếu muốn tiêu đề

   Lưu ý: mỗi flow chỉ post vào **1** đích (1 channel HOẶC 1 group chat) — nếu 4 dự án gồm cả channel lẫn group chat lẫn lộn thì không sao, code không cần biết flow đó trỏ vào loại nào, chỉ cần đúng URL trigger tương ứng với đúng dự án trong `src/config.js`.
4. **Save** → quay lại bước trigger **"When a HTTP request is received"**, nó sẽ hiện ra **HTTP POST URL** (dạng `https://prod-xx.xxx.logic.azure.com/...`) → copy URL này
5. Lặp lại đúng 4 bước trên cho từng dự án/kênh còn lại, mỗi flow một URL riêng. Thứ tự khớp với `src/config.js`:
   1. Plan-B_Gyomu Kaizen(業務改善) → `TEAMS_FLOW_URL_1`
   2. Plan-B_CM Agent → `TEAMS_FLOW_URL_2`
   3. Plan-B_Ragoon → `TEAMS_FLOW_URL_3`
   4. TRE-Maintainance → `TEAMS_FLOW_URL_4`
6. Test nhanh 1 flow trước khi làm hết 4: dán URL vào `.env` (`TEAMS_FLOW_URL_1=...`), chạy `node --env-file=.env src/index.js`, kiểm tra tin nhắn có vào đúng kênh Teams không, rồi mới làm tiếp 3 flow còn lại.

## 4. Tạo GitHub repo + đẩy code

```bash
cd clickup-teams-reporter
git init
git add .
git commit -m "Initial ClickUp -> Teams reporter"
```

Tạo repo mới (private) trên https://github.com/new, rồi:

```bash
git remote add origin <URL repo của bạn>
git branch -M main
git push -u origin main
```

## 5. Thêm Secrets trên GitHub

Vào repo → **Settings → Secrets and variables → Actions → New repository secret**, thêm:
- `CLICKUP_API_TOKEN`
- `TEAMS_FLOW_URL_1` .. `TEAMS_FLOW_URL_4` (URL lấy ở bước 3, theo đúng thứ tự 4 dự án trong `src/config.js`)

## 6. Test workflow trên GitHub Actions

Vào tab **Actions** → chọn workflow **ClickUp Teams Report** → **Run workflow** để chạy thử ngay (không cần đợi lịch cron), kiểm tra log và tin nhắn xuất hiện đúng kênh Teams.

## Lịch chạy

~9:23 sáng và ~15:47 chiều giờ Việt Nam, Thứ 2 - Thứ 6 (`.github/workflows/report.yml`). Giờ cron cố tình đặt lệch phút tròn (không phải `:00`/`:30`) vì GitHub Actions hay bị nghẽn tải và delay đúng vào các mốc giờ tròn — đặt lệch giúp giảm khả năng bị trễ, nhưng vẫn không đảm bảo chạy đúng y giờ 100%. GitHub tự tắt scheduled workflow nếu repo không có hoạt động trong 60 ngày — khi đó cần vào tab Actions bật lại thủ công.
