import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50 text-stone-600">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">❤️</span>
            <span className="font-semibold text-stone-900">CivicPulse</span>
            <span className="text-sm">— Your neighborhood&apos;s heartbeat</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-rose-600">Map</Link>
            <Link href="/report" className="hover:text-rose-600">Report</Link>
            <Link href="/reports" className="hover:text-rose-600">My Reports</Link>
            <Link href="/login" className="hover:text-rose-600">Sign in</Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-stone-400 text-center sm:text-left">
          Report civic issues. Community verification. Transparent resolution.
        </p>
      </div>
    </footer>
  );
}
