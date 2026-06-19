import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-[1440px] mx-auto px-5 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[13px] text-secondary">
          &copy; {new Date().getFullYear()} Anime Blog. A high-fidelity demo.
        </p>
        <div className="flex items-center gap-6">
          <Link href="#" className="text-[13px] text-secondary hover:text-primary">Twitter</Link>
          <Link href="#" className="text-[13px] text-secondary hover:text-primary">RSS</Link>
          <Link href="#" className="text-[13px] text-secondary hover:text-primary">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
