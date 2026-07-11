import Link from "next/link";

export function PublicHeader() {
  return <header className="sticky top-0 z-40 border-b border-[#e7e8ef] bg-white/92 px-4 backdrop-blur-xl sm:px-6"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5"><Link href="/" className="inline-flex min-h-11 items-center font-black tracking-[-.04em]">Seraphim</Link><nav className="hidden items-center gap-6 text-sm font-semibold text-[#62697d] md:flex" aria-label="Public navigation"><Link href="/features">Features</Link><Link href="/how-it-works">How it works</Link><Link href="/pricing">Beta access</Link><Link href="/support">Support</Link></nav><div className="flex items-center gap-1 sm:gap-2"><Link href="/login" className="inline-flex min-h-11 items-center px-2 text-sm font-bold sm:px-3">Sign in</Link><Link href="/signup" className="inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-3 text-sm font-bold text-white sm:px-4">Create account</Link></div></div></header>;
}

export function PublicFooter() {
  return <footer className="border-t border-[#e1e3eb] bg-white px-4 py-10 sm:px-6"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-[#747b8f] sm:flex-row"><div><p className="font-black text-ink-950">Seraphim</p><p className="mt-2">Prospect demos and responsible outreach, with human review built in.</p></div><nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/acceptable-use">Acceptable use</Link><Link href="/support">Support</Link></nav></div></footer>;
}
