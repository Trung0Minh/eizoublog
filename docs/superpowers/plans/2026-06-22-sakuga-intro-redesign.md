# Sakuga Intro Page Redesign & Navbar Search Bugfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Sakuga Intro page (/nhap-mon-sakuga) into a centered, readable single-column layout, collapse the navbar search bar to an icon on tablet views to prevent overlapping, and add hyperlink marks directly to external resource titles.

**Architecture:** We will adjust responsive styling classes inside the navbar component to hide the full search input trigger container below 1024px (`lg`), swapping in a circular search icon button that fires the same custom event. The client-side Sakuga page component will be modified from a 2-column layout to a centered 1-column layout. The default content JSON body will be updated with proper Tiptap link marks.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS, Lucide Icons, Tiptap JSON Content format.

---

### Task 1: Update Search Trigger Collapse in Navbar Component

**Files:**
- Modify: `components/layout/Navbar.tsx:1-80`
- Test: `tests/unit/layout.test.tsx`

- [ ] **Step 1: Update Navbar Imports**
  Modify imports in `components/layout/Navbar.tsx` to include `Search` from `lucide-react`.
  
  ```typescript
  import { Sparkles, Search } from "lucide-react"
  ```

- [ ] **Step 2: Update Navbar Search Section Layout**
  In `components/layout/Navbar.tsx`, update lines 53-56 to collapse the search container below the `lg` breakpoint and show a compact icon trigger.
  
  ```tsx
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden lg:block w-[280px]">
              <CommandMenuTrigger />
            </div>
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("open-command-menu"))}
              className="hidden md:flex lg:hidden h-9 w-9 items-center justify-center rounded-full border border-border-default bg-subtle-bg text-text-secondary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Tìm kiếm bài viết"
              title="Tìm kiếm"
            >
              <Search className="h-4 w-4" />
            </button>
  ```

- [ ] **Step 3: Run Layout Unit Tests**
  Run: `npx vitest run tests/unit/layout.test.tsx`
  Expected: PASS

- [ ] **Step 4: Type Check and Lint**
  Run: `npx tsc --noEmit && npm run lint`
  Expected: Clean compilation and no lint errors in Navbar.tsx

- [ ] **Step 5: Commit changes**
  Run:
  ```bash
  git add components/layout/Navbar.tsx
  git commit -m "feat: collapse navbar search to icon-button on tablet viewports"
  ```

---

### Task 2: Redesign Nhập môn Sakuga Page Layout

**Files:**
- Modify: `app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx:395-475`

- [ ] **Step 1: Replace double-column layout with centered article column**
  In `app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx`, update the main return section (around line 395 to end of component) to render a single, centered layout.
  
  ```tsx
    return (
      <div className="min-h-screen flex flex-col pt-0 group relative">
        {isAdmin && (
          <Button
            onClick={() => setIsEditing(true)}
            className="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-100 z-10"
            size="sm"
            variant="outline"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Chỉnh sửa trang
          </Button>
        )}
  
        <main className="flex-1 w-full max-w-[800px] mx-auto pt-8 md:pt-16 pb-20 px-4 md:px-0">
          <div className="bg-subtle-bg/80 backdrop-blur-sm border-[3px] border-border/60 rounded-[24px] p-6 md:p-12 shadow-xl relative isolate overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-tr-[100px] -z-10" />
  
            <div className="flex flex-col">
              {/* Title & Header Block */}
              <div className="text-center mb-8">
                <ScrollReveal>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <HelpCircle className="w-6 h-6 text-accent animate-pulse" />
                    <h1 className="text-[32px] md:text-[40px] font-display font-bold text-text-primary leading-tight">
                      <TextReveal className="text-accent" text={data.title} />
                    </h1>
                  </div>
                </ScrollReveal>
                {data.shortIntro && (
                  <ScrollReveal delay={0.1}>
                    <p className="text-[15px] italic text-text-secondary border-t border-b border-border/50 py-3 mt-4 max-w-[600px] mx-auto text-center">
                      {data.shortIntro}
                    </p>
                  </ScrollReveal>
                )}
              </div>
  
              {/* Mascot Hero Card */}
              <ScrollReveal delay={0.2} className="w-full max-w-[480px] mx-auto mb-8">
                <div className="relative aspect-[16/10] rounded-[16px] overflow-hidden border-4 border-white dark:border-border shadow-lg">
                  <img
                    src="https://picsum.photos/seed/sakugamascot/800/500"
                    alt="Mascot"
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-accent text-white w-16 h-16 rounded-full flex items-center justify-center font-display font-bold shadow-md rotate-12">
                    Start!
                  </div>
                </div>
              </ScrollReveal>
  
              {/* Main Content Column */}
              <div className="space-y-4 text-[16px] text-text-secondary font-sans [&_.post-content]:!mx-0 [&_.post-content]:!max-w-none [&_.ProseMirror_p]:!mx-0 [&_.ProseMirror_ul]:!mx-0 [&_.ProseMirror_ol]:!mx-0 [&_.ProseMirror_p]:!max-w-none">
                <ScrollReveal delay={0.3}>
                  <PostBody content={data.body} />
                </ScrollReveal>
  
                <ScrollReveal delay={0.4}>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center pt-6 border-t border-border/50">
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-[5px] bg-accent px-4 text-[13px] font-bold text-white transition-colors hover:bg-accent/90"
                      href="/"
                    >
                      Bài viết mới nhất
                    </Link>
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-[5px] border border-border px-4 text-[13px] font-bold text-text-primary transition-colors hover:bg-subtle-bg"
                      href="/resources"
                    >
                      Nguồn tham khảo
                    </Link>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  ```

- [ ] **Step 2: Type Check and Lint**
  Run: `npx tsc --noEmit && npm run lint`
  Expected: Clean compilation and no lint errors

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx
  git commit -m "feat: redesign nhap-mon-sakuga page to centered single-column layout"
  ```

---

### Task 3: Add Direct Hyperlinks to Guide Content Titles

**Files:**
- Modify: `app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx:27-211`

- [ ] **Step 1: Hyperlink titles inside defaultBody**
  In `app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx`, refactor `defaultBody` content (specifically the first paragraph, and all headings/paragraphs inside sections) to add Tiptap link marks to titles and keep colons separate.
  
  ```typescript
  const defaultBody: JSONContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Chào mừng bạn đến với chuyên mục dành riêng cho những ai muốn bắt đầu tìm hiểu về Sakuga (作画) và quy trình sản xuất anime. Dưới đây là tập hợp đầy đủ những nguồn tài liệu uy tín, được chọn lọc kỹ càng để bạn tự học từ cơ bản đến nâng cao mà không cần mất công tìm kiếm khắp nơi.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Phần 1: Khái niệm & Thuật ngữ cơ bản" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              { type: "bold" },
              {
                type: "link",
                attrs: {
                  href: "https://www.animenewsnetwork.com/feature/2015-09-30/the-joy-of-sakuga/.93437",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ],
            text: "The Joy of Sakuga (Anime News Network)",
          },
          {
            type: "text",
            text: ": Bài viết kinh điển giải thích Sakuga là gì, tinh thần tôn vinh họa sĩ, và tại sao việc hiểu chuyển động lại làm thay đổi hoàn toàn cách chúng ta thưởng thức anime. Bạn nên bắt đầu từ đây để lấy cảm hứng.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              { type: "bold" },
              {
                type: "link",
                attrs: {
                  href: "https://blog.sakugabooru.com/glossary/",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ],
            text: "Sakuga Glossary (Sakugabooru Blog)",
          },
          {
            type: "text",
            text: ": Từ điển tra cứu nhanh tất cả thuật ngữ kỹ thuật hoạt họa từ Genga, Douga đến các kỹ thuật phức tạp hơn. Đây là cẩm nang hữu ích khi bạn tham gia thảo luận chuyên sâu.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Phần 2: Quy trình sản xuất Anime (Production Pipeline)" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              { type: "bold" },
              {
                type: "link",
                attrs: {
                  href: "https://blog.sakugabooru.com/2017/05/02/the-pre-production-of-anime-series-production-notes-1/",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ],
            text: "The Pre-Production of Anime Series (Sakuga Blog)",
          },
          {
            type: "text",
            text: ": Chuỗi bài viết gồm 4 phần giải thích tường tận cách một ý tưởng kịch bản (Scripting), thiết kế nhân vật (Design Work), và lập kế hoạch (Planning) được triển khai trước khi animator đặt bút vẽ.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              { type: "bold" },
              {
                type: "link",
                attrs: {
                  href: "https://blog.sakugabooru.com/2016/09/20/guide-to-ending-credits-production-notes/",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ],
            text: "Guide to Ending Credits (Sakuga Blog)",
          },
          {
            type: "text",
            text: ": Hướng dẫn chi tiết cách đọc bảng chữ chạy cuối phim (credits) để hiểu chính xác họa sĩ diễn hoạt (Key Animator) hay đạo diễn tập phim (Episode Director) đóng vai trò gì.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              { type: "bold" },
              {
                type: "link",
                attrs: {
                  href: "https://washida.org/posts/anime-production-detailed-guide",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ],
            text: "Anime Production detailed guide (Washi's Blog)",
          },
          {
            type: "text",
            text: ": Bài viết trực quan kèm sơ đồ quy trình công việc chi tiết từ phân cảnh phân giải (E-konte) đến khâu ghép hiệu ứng ánh sáng kỹ thuật số.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Phần 3: Hướng dẫn thực hành & Starter Pack" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              { type: "bold" },
              {
                type: "link",
                attrs: {
                  href: "https://animetudes.com/2021/04/09/exploring-sakuga-a-sakuga-starter-pack/",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ],
            text: "Exploring Sakuga - A Sakuga Starter Pack (Animetudes)",
          },
          {
            type: "text",
            text: ": Bản đồ định hướng hoàn chỉnh cho người mới: đề xuất những bộ anime nổi bật, các video tổng hợp (MAD), và danh sách animator tiêu biểu để bạn theo dõi.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [{ type: "bold" }],
            text: "Anime đề xuất để hiểu rõ hơn: ",
          },
        ],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    marks: [{ type: "italic" }],
                    text: "Shirobako",
                  },
                  {
                    type: "text",
                    text: ": Series truyền hình mô phỏng chân thực và đầy đủ nhất mọi khía cạnh trong quy trình vận hành của một studio anime.",
                  },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    marks: [{ type: "italic" }],
                    text: "Keep Your Hands Off Eizouken!",
                  },
                  {
                    type: "text",
                    text: ": Bộ anime tôn vinh niềm đam mê sáng tạo hoạt họa thô mộc và tinh thần tự làm phim ngắn.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Phần 4: Cơ sở dữ liệu nâng cao" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              { type: "bold" },
              {
                type: "link",
                attrs: {
                  href: "https://www.sakugabooru.com",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ],
            text: "Sakugabooru Database",
          },
          {
            type: "text",
            text: ": Trang web lớn nhất lưu trữ các trích đoạn phim nổi bật. Bạn có thể sử dụng hệ thống tag để tìm kiếm trực tiếp tác phẩm của những animator yêu thích (như Yutaka Nakamura, Yoh Yoshinari) và nghiên cứu phong cách của họ.",
          },
        ],
      },
    ],
  }
  ```

- [ ] **Step 2: Verify Compilation and Run All Tests**
  Run: `npx tsc --noEmit && npx vitest run`
  Expected: Clean compilation and all tests pass (including unit/layout.test.tsx and unit/resources-ui.test.tsx)

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx
  git commit -m "feat: add direct Tiptap links to titles in guide default content"
  ```
