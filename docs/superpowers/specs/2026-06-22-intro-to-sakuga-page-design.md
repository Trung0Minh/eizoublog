# Design Spec: Nhập môn Sakuga Page

## 1. Overview
Create a new dedicated static-style page "/nhap-mon-sakuga" (Nhập môn Sakuga) to guide beginners through resources on anime production and sakuga. The page will be editable on-web by admins using the TipTap editor, matching the rich design layout of the "Giới thiệu" (About) page.

---

## 2. Proposed Changes

### 2.1 Route Configuration & Database
- **Slug**: `nhap-mon-sakuga`
- **Database / API Integration**:
  - Update `app/api/admin/site-pages/[slug]/route.ts`:
    - Add `nhap-mon-sakuga` to `editablePageSlugs`.
    - Update `titleForSlug` to map `nhap-mon-sakuga` to `"Nhập môn Sakuga"`.

### 2.2 Client Page & Svelte/React Components
- **New Files**:
  - `app/(public)/nhap-mon-sakuga/page.tsx`:
    - Server Component that checks auth session (isAdmin) and fetches the page with slug `"nhap-mon-sakuga"` from `prisma.sitePage`.
    - Generates metadata with title "Nhập môn Sakuga".
  - `app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx`:
    - Client Component with state for viewing and editing.
    - Uses TipTapEditor for editing the body and textareas for title and description.
    - Layout matches the double-column format of `AboutClient.tsx` (featured vertical artwork/mascot on the left, rich text and directory cards on the right).

### 2.3 Initial Content (Seeded / Default)
- **Title**: Nhập môn Sakuga (作画) – Hướng dẫn toàn diện cho người mới
- **Intro**: Hướng dẫn toàn diện tích hợp link giới thiệu các tài liệu uy tín nhất cho người mới bắt đầu tiếp cận Sakuga và ngành sản xuất anime.
- **Why We Do This**: "Để hỗ trợ người mới tiếp cận hoạt họa chuyên sâu một cách dễ dàng nhất, tổng hợp toàn bộ tài liệu uy tín tại một nơi để bạn không cần mất công tìm kiếm."
- **Content Blocks**:
  - **Phần 1: Khái niệm & Thuật ngữ cơ bản**:
    - *The Joy of Sakuga* (ANN): Giới thiệu về tinh thần Sakuga và vẻ đẹp hoạt họa mộc mạc.
    - *Sakuga Glossary* (Sakugabooru): Từ điển tra cứu thuật ngữ sản xuất.
  - **Phần 2: Quy trình sản xuất Anime (Production Pipeline)**:
    - *The Pre-Production of Anime*: Tìm hiểu khâu lên ý tưởng, kịch bản, thiết kế.
    - *Guide to Ending Credits*: Cách đọc và nhận diện vai trò của nhân sự chạy chữ cuối phim.
    - *Anime Production Line (Washi's Blog)*: Bản đồ quy trình chi tiết các bước chuyển động.
  - **Phần 3: Starter Pack & Trải nghiệm thực tế**:
    - *Exploring Sakuga - Starter Pack*: Đề xuất anime, MADs và animator nổi bật.
    - *Shirobako* & *Keep Your Hands Off Eizouken!*: Hai bộ anime nhập môn xuất sắc.
  - **Phần 4: Cơ sở dữ liệu nâng cao**:
    - *Sakugabooru Database*: Hệ thống tag tìm kiếm animator và trích đoạn.

### 2.4 Layout & Navigation Integration
- **Navbar**: Add `{ href: "/nhap-mon-sakuga", label: "Nhập môn Sakuga" }` to the `NAV_LINKS` list in `components/layout/Navbar.tsx`.
- **Footer**: Add a link to `/nhap-mon-sakuga` labeled "Nhập môn Sakuga" in `components/layout/Footer.tsx`.

---

## 3. Verification Plan
1. **Interactive Check**: Launch the local dev server and log in as an Admin to test editing, saving, and canceling updates.
2. **Metadata & Layout Check**: Ensure page fits within the layout container and metadata resolves canonical `/nhap-mon-sakuga`.
3. **Unit Tests**: Run layout and resources tests to verify no navigation or styling breaks.
