import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xs">Z</span>
              </div>
              <span className="font-bold text-base">ZeroAgent</span>
            </div>
            <p className="text-secondary-foreground/60 text-sm leading-relaxed">
              Pakistan's trusted marketplace for premium event venues. Verified owners. Serious inquiries only.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-secondary-foreground/90">Explore</h4>
            <ul className="space-y-2">
              <li><Link href="/venues" className="text-sm text-secondary-foreground/60 hover:text-primary transition-colors">Event Spaces</Link></li>
              <li><Link href="/venues?eventType=Wedding" className="text-sm text-secondary-foreground/60 hover:text-primary transition-colors">Wedding Venues</Link></li>
              <li><Link href="/venues?eventType=Corporate+Event" className="text-sm text-secondary-foreground/60 hover:text-primary transition-colors">Corporate Events</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-secondary-foreground/90">For Owners</h4>
            <ul className="space-y-2">
              <li><Link href="/register" className="text-sm text-secondary-foreground/60 hover:text-primary transition-colors">List your venue</Link></li>
              <li><Link href="/dashboard" className="text-sm text-secondary-foreground/60 hover:text-primary transition-colors">Owner Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-secondary-foreground/90">Trust & Safety</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-secondary-foreground/60"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span>Verified Listings</li>
              <li className="flex items-center gap-2 text-sm text-secondary-foreground/60"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span>Secure Platform</li>
              <li className="flex items-center gap-2 text-sm text-secondary-foreground/60"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span>Privacy Protected</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-secondary-foreground/40">© 2026 ZeroAgent Pakistan. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-xs text-secondary-foreground/40 hover:text-primary cursor-pointer transition-colors">Privacy</span>
            <span className="text-xs text-secondary-foreground/40 hover:text-primary cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
