# Design Spec: Sakuga Intro Page Redesign & Navbar Search Bugfix

**Date**: 2026-06-22  
**Feature**: Centered Article Layout for /nhap-mon-sakuga, Navbar Search Collapse, and Guide Content Hyperlinks

---

## 1. Objectives
- **Fix Navbar Search Bar Overlap**: Prevent the text-based search input widget from overlapping with the absolute-centered navigation links on viewports between `768px (md)` and `1024px (lg)`.
- **Improve Page Layout Aesthetics**: Replace the current double-column layout on `/nhap-mon-sakuga` with a single-column centered article layout to eliminate empty column space.
- **Implement Direct Hyperlinks**: Make the guide's external source titles clickable links directly instead of using separate text labels/URLs.

---

## 2. Component Design & Changes

### A. Navbar (`components/layout/Navbar.tsx`)
On screen widths `768px <= width < 1024px` (`md` to `lg` breakpoints):
- Hide the `CommandMenuTrigger` input layout (`hidden lg:block w-[280px]`).
- Render a new compact search trigger button:
  - Render a round, styled button `h-9 w-9` with a center-aligned `Search` icon.
  - Hover styles: border/text changes to the brand accent color.
  - Interaction: Dispatches the `"open-command-menu"` event when clicked.
- On screens `1024px+` (`lg`):
  - Display the original `CommandMenuTrigger` (`280px` wide).

### B. Nhập môn Sakuga Page (`app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx`)
Transition layout from standard grid to a centered article container:
- Main container: `mx-auto max-w-[800px] w-full px-4 md:px-0`.
- **Title Block**:
  - Center-aligned heading: `text-[32px] md:text-[40px] text-center`.
  - Subtitle: `text-center text-[15px] italic text-text-secondary border-t border-b border-border/50 py-3 my-6 max-w-[600px] mx-auto`.
- **Mascot Hero Image**:
  - Center-aligned card: `max-w-[480px] w-full mx-auto aspect-[16/10] md:aspect-[16/9] object-cover rounded-[16px] border border-border shadow-md mb-8 overflow-hidden`.
- **Content Block**:
  - Centered text matching typical high-end typography width limits.
- **Buttons (CTAs)**:
  - Center-aligned grid/row layout.

### C. Default Guide Content Hyperlinks
Refactor `defaultBody` in `IntroToSakugaClient.tsx` to include Tiptap link marks for titles:
1. **The Joy of Sakuga (Anime News Network)** $\rightarrow$ link mark to `https://www.animenewsnetwork.com/feature/2015-09-30/the-joy-of-sakuga/.93437`
2. **Sakuga Glossary (Sakugabooru Blog)** $\rightarrow$ link mark to `https://blog.sakugabooru.com/glossary/`
3. **The Pre-Production of Anime Series (Sakuga Blog)** $\rightarrow$ link mark to `https://blog.sakugabooru.com/2017/05/02/the-pre-production-of-anime-series-production-notes-1/`
4. **Guide to Ending Credits (Sakuga Blog)** $\rightarrow$ link mark to `https://blog.sakugabooru.com/2016/09/20/guide-to-ending-credits-production-notes/`
5. **Anime Production detailed guide (Washi's Blog)** $\rightarrow$ link mark to `https://washida.org/posts/anime-production-detailed-guide`
6. **Exploring Sakuga - A Sakuga Starter Pack (Animetudes)** $\rightarrow$ link mark to `https://animetudes.com/2021/04/09/exploring-sakuga-a-sakuga-starter-pack/`

---

## 3. Testing & Verification Criteria
1. **Navbar Layout Verification**: Check navbar on various screen widths to verify search icon collapses underneath `1024px` and does not overlap nav text links.
2. **Intro Page Layout Verification**: Verify that layout is fully centered on both desktop and mobile viewports.
3. **Hyperlink Verification**: Verify that resource titles are links and open correctly in a new window.
4. **Build & Test Verification**: Verify `npx tsc --noEmit` is clean and all tests continue to pass.
