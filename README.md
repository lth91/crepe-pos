# Crepe POS

Ứng dụng bán hàng (POS) cho quán crepe, chạy trên Next.js 16 + Neon Postgres, tối ưu cho điện thoại.

- `/` — trang Coming Soon
- `/orderdth` — màn hình POS (yêu cầu đăng nhập)

## Chạy local

```bash
npm install
cp .env.example .env.local   # rồi sửa giá trị bên trong
npm run dev
```

Mở http://localhost:3000/orderdth.

Lần đầu chạy với database mới, gọi `GET /api/setup` một lần để tạo bảng `orders`.

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | Có | Connection string của Neon Postgres |
| `POS_ACCOUNTS` | Có | Danh sách tài khoản đăng nhập, xem bên dưới |

### `POS_ACCOUNTS`

Các tài khoản cách nhau bằng dấu phẩy, dấu chấm phẩy hoặc xuống dòng. Mỗi tài khoản có dạng `username:password:role`:

```
POS_ACCOUNTS="nhanvien01:mk-nv-01:staff,nhanvien02:mk-nv-02:staff,admin:mk-admin:admin"
```

- Dấu ngoặc kép bao quanh giá trị và khoảng trắng thừa được bỏ qua.
- `role` là `staff` (chỉ bán hàng, xem lịch sử) hoặc `admin` (thêm quyền xem thống kê).
- Tên đăng nhập không phân biệt hoa thường.
- Mật khẩu không được chứa dấu `:`, `,` hoặc `;`.
- Nếu biến này trống, không ai đăng nhập được và API trả lỗi 503.

Trên Vercel, đặt các biến này tại **Project → Settings → Environment Variables**, sau đó redeploy.

## Scripts

```bash
npm run dev     # chạy dev server
npm run build   # build production
npm run start   # chạy bản build
npm run lint    # eslint
```
