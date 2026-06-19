import Link from "next/link"

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[calc(100dvh-14rem)] flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-display text-[48px] font-bold leading-none text-accent">
        404
      </p>
      <h1 className="mt-5 font-display text-xl font-bold text-text-primary">
        Không tìm thấy trang
      </h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
        Nội dung bạn đang tìm có thể đã được chuyển hoặc không còn tồn tại.
      </p>
      <Link
        className="mt-6 rounded-[5px] bg-accent px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-85"
        href="/"
      >
        Về trang chủ
      </Link>
    </main>
  )
}
