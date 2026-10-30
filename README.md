# FootDraw VN ⚽

Nền tảng quản lý đội bóng đá phủi toàn diện (Full FootDraw Platform Replication) dành cho các đội bóng phong trào, câu lạc bộ nghiệp dư tại Việt Nam.

## 🌟 Toàn bộ 6 Trụ cột Tính năng (FootDraw Core Pillars)

### 1. ⚡ Chia đội thông minh (Draw & Balance - `/`)
- Thuật toán tự động cân bằng thủ môn (GK), dàn trải các tuyến (DEF, MID, FWD) và tối ưu độ lệch rating giữa 2 đội về $\approx 0$.
- **Sa bàn sân cỏ (Tactical Pitch):** Hiển thị sơ đồ sân bóng thực tế, áo đấu và tên cầu thủ.
- **Hoán đổi thủ công:** Bấm vào 2 cầu thủ bất kỳ để đổi chỗ ngay lập tức.
- **Xuất kết quả:** 1-chạm tải ảnh PNG độ nét cao hoặc sao chép tin nhắn format Zalo.

### 2. 📋 Phòng đấu & Điểm danh Realtime (`/match/[id]`)
- Sinh link phòng riêng cho từng trận (VD: `/match/fc-anh-em-t5`).
- Anh em bấm vào link tự điểm danh (**"Có mặt (IN)"** hoặc **"Báo bận (OUT)"**) không cần đăng ký tài khoản.
- Thanh tiến độ quân số realtime (ví dụ: `12 / 14 cầu thủ`).

### 3. 📅 Quản lý Trận đấu & Nhập tỷ số (`/matches`)
- Danh sách các trận: Sắp diễn ra & Đã kết thúc.
- **Nhập tỷ số trận đấu (Scoreboard):** Ghi nhận tỷ số Đội Cam vs Đội Xanh.
- **Ghi nhận sự kiện:** Ai ghi bàn (⚽ Goals), ai kiến tạo (👟 Assists).
- **Bầu chọn MVP:** Chọn Cầu thủ xuất sắc nhất trận đấu.
- Tự động cập nhật thành tích vào hồ sơ của từng cầu thủ!

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
