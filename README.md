# FootDraw VN ⚽

Nền tảng quản lý đội bóng đá phủi toàn diện được xây dựng chuẩn theo mô hình và luồng tính năng của **FootDraw (footdraw.com)** dành cho các đội bóng phong trào, câu lạc bộ nghiệp dư tại Việt Nam.

## 🌟 Cấu trúc Tính năng Chuẩn FootDraw (Core Pillars)

### 1. 📋 Điểm danh Trận đấu - Attendance Polls (`/polls` & `/poll/[id]`)
- **Quản lý đợt điểm danh (`/polls`):** Đội trưởng tạo lịch thi đấu tuần này (Ngày, Giờ, Sân, Thể thức 5v5/7v7/11v11, Sĩ số cần).
- **Link điểm danh công khai (`/poll/[id]`):**
  - Đội trưởng bấm 1-click **"Copy link Zalo"** để gửi vào nhóm chat.
  - Thành viên mở link trên điện thoại: Chỉ thấy thông tin trận đấu, tiến độ quân số (VD: `11 / 14 cầu thủ`).
  - **Điểm danh 1-chạm:** Chọn tên trong danh sách hoặc gõ tên khách ➔ Bấm **"✅ Có mặt (Đi đá)"** hoặc **"❌ Báo bận"**.
  - **Tự động nhớ tên:** Khi mở lại link, hệ thống chào tên bạn và cho phép đổi trạng thái cực nhanh.
  - **Tuyệt đối an toàn:** Ẩn điểm rating, ẩn nút chia đội, không ai có thể sửa/xóa danh sách của người khác.
  - **Dành cho Đội trưởng:** Nút **"⚡ Chia Đội Ngay (Draw Teams)"** để nạp thẳng danh sách những người có mặt sang trang Chia đội.

### 2. ⚡ Chia đội Cân bằng Thông minh (`/draw`)
- Lấy danh sách trực tiếp từ đợt Điểm danh (`/draw?pollId=...`) hoặc chọn từ danh sách thành viên FC.
- **Thuật toán tự động cân bằng:** Tách đều thủ môn (GK), dàn trải các tuyến (DEF, MID, FWD) và tối ưu độ chênh lệch rating giữa các đội về $\approx 0$.
- **Sa bàn sân cỏ (Tactical Pitch):** Hiển thị sơ đồ sân bóng thực tế, áo đấu và tên cầu thủ.
- **Hoán đổi thủ công (Swap):** Bấm chọn 2 cầu thủ ở 2 đội để đổi chỗ ngay lập tức.
- **Xuất kết quả:** 1-chạm tải ảnh PNG độ nét cao hoặc sao chép tin nhắn format Zalo.
- **Tạo trận đấu:** Bấm **"Lưu thành trận đấu"** để chuyển sang trang theo dõi kết quả thi đấu.

### 3. 📅 Quản lý Trận đấu & Nhập tỷ số (`/matches`)
- Danh sách các trận: Sắp diễn ra & Đã kết thúc.
- **Nhập tỷ số trận đấu (Scoreboard):** Ghi nhận tỷ số Đội Cam vs Đội Xanh.
- **Ghi nhận sự kiện:** Ai ghi bàn (⚽ Goals), ai kiến tạo (👟 Assists).
- **Bầu chọn MVP:** Chọn Cầu thủ xuất sắc nhất trận đấu.
- Tự động cộng dồn thành tích vào hồ sơ của từng cầu thủ!

### 4. 👥 Quản lý Thành viên Đội bóng (`/players`)
- Danh sách toàn bộ thành viên cố định của FC.
- Bộ lọc theo vị trí (GK, DEF, MID, FWD), tìm kiếm theo tên, sắp xếp theo Rating, Bàn thắng, Số trận, Tỷ lệ thắng.
- Thẻ hồ sơ cá nhân: Số trận (Caps), Bàn thắng, Kiến tạo, W-D-L streak, Tỷ lệ thắng %, Danh hiệu MVP.

### 5. 🏆 Bảng vàng Thống kê & Thành tích (`/stats`)
- 👑 **Vua Phá Lưới (Golden Boot):** Bảng xếp hạng ghi bàn + bục vinh danh Top 3 (Vàng, Bạc, Đồng).
- 📈 **Vua Kiến Tạo (Playmakers):** Top chân chuyền của đội.
- 🌟 **Cầu thủ xuất sắc nhất (Most MVPs):** Người đạt nhiều danh hiệu trận đấu nhất.
- 🔥 **Tỷ lệ thắng cao nhất (Highest Win Rate %):** Phong độ của các thành viên.

### 6. ⚖️ So sánh Cầu thủ Đối đầu (`/compare`)
- Đặt 2 cầu thủ lên bàn cân so sánh trực diện (Head-to-Head Compare).
- So sánh song song: Rating, Bàn thắng, Kiến tạo, Số trận, Tỷ lệ thắng %, Danh hiệu MVP và Hiệu suất bàn/trận.
- Thanh so sánh trực quan (Visual Comparison Bars).

### 7. 💰 Chia tiền sân & Quỹ bóng đá (`/cost-splitter`)
- Nhập tiền thuê sân, tiền nước uống, chi phí khác.
- Tự động chia đều cho số người đá, tính ra số tiền mỗi người (làm tròn nghìn đồng).
- **Tự động tạo mã VietQR:** Anh em quét mã chuyển khoản tức thì không cần nhập số tài khoản.
- 1-click sao chép tin nhắn Zalo thu tiền sân.

---

## 💾 Kiến trúc Dữ liệu (Database)
- **Server-Side API Store:** Tích hợp sẵn bộ lưu trữ backend `/api/polls`, `/api/matches`, `/api/players` lưu dữ liệu tập trung trên server. Bất kỳ thành viên nào mở link trên điện thoại (4G, Wifi) đều đọc và ghi vào chung một phòng điểm danh thật 100%.
- **Firebase Firestore:** Hỗ trợ kết nối Cloud Realtime đồng bộ tức thì giữa các thiết bị.

---

## 🚀 Khởi chạy dự án

```bash
npm install
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

Build Production:
```bash
npm run build
npm run start
```
