import { Link } from "react-router-dom";
import { Wrench, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export const PHONE = "7019452497";

export function SiteNav({ active }) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Home", to: "/#top", key: "home" },
    { label: "Services", to: "/#services", key: "services" },
    { label: "Reviews", to: "/#reviews", key: "reviews" },
  ];
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-black/85 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[70px] flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3" data-testid="brand-logo">
          <div className="h-11 w-11 rounded-md bg-[#FFD400] flex items-center justify-center shrink-0">
            <Wrench className="h-6 w-6 text-black" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <div className="font-display font-black text-lg sm:text-xl tracking-tight">MACHINE WORKSHOP</div>
            <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-white/50 mt-1">Multi Brand Two Wheeler Service</div>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a key={l.key} href={l.to} className={`text-sm font-medium uppercase tracking-wide transition-colors ${active === l.key ? "text-[#FFD400]" : "text-white/70 hover:text-white"}`} data-testid={`nav-${l.key}`}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/book" className="hidden sm:block" data-testid="nav-book-service">
            <Button className="h-10 rounded-md bg-[#FFD400] text-black font-bold uppercase hover:bg-[#E6BE00] transition-colors">Book Service</Button>
          </Link>
          <Link to="/login" data-testid="owner-login-link">
            <Button variant="outline" className="h-10 rounded-md border-white/20 bg-transparent hover:bg-white/5 text-white text-sm font-semibold">Owner Login</Button>
          </Link>
          <button className="lg:hidden text-white" onClick={() => setOpen(!open)} data-testid="mobile-menu-btn">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-white/10 bg-black px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.key} href={l.to} className="text-sm font-medium uppercase tracking-wide text-white/80" onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <Link to="/book" className="text-sm font-bold uppercase text-[#FFD400]" onClick={() => setOpen(false)}>Book Service</Link>
        </div>
      )}
    </nav>
  );
}
