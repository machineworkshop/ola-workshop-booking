import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { SiteNav, PHONE } from "../components/SiteNav";
import { Button } from "../components/ui/button";
import {
  Phone,
  CalendarCheck,
  Wrench,
  ShieldCheck,
  Clock,
  Zap,
  Star,
  ArrowRight,
  Truck,
  Award,
  IndianRupee,
  Quote,
} from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1623993308369-017255b87e2c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

const BRANDS = [
  { name: "Ola Electric", tag: "S1 Pro / S1 Air" },
  { name: "Ather", tag: "450X / 450S" },
  { name: "TVS iQube", tag: "All variants" },
  { name: "Hero Vida", tag: "V1 / V2" },
  { name: "Bajaj Chetak", tag: "Premium / Urbane" },
  { name: "Honda / Others", tag: "Multi-brand" },
];

const REVIEWS = [
  { name: "Priya S.", area: "Indiranagar", text: "Booked a slot for my Ola S1 and it was fixed the same day. Genuine parts, fair price. Highly recommend!", stars: 5 },
  { name: "Rahul M.", area: "HSR Layout", text: "Battery issue on my Ather sorted quickly. The pickup & drop made it super convenient.", stars: 5 },
  { name: "Anitha K.", area: "Whitefield", text: "Transparent pricing and friendly staff. My TVS iQube runs like new now.", stars: 5 },
];

export default function Home() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.get("/config").then((r) => setConfig(r.data)).catch(() => setConfig(null));
  }, []);

  const closed = config && (!config.is_available || config.holiday_mode);

  return (
    <div id="top" className="min-h-screen bg-black text-white font-sans">
      <SiteNav active="home" />

      {/* Hero */}
      <section className="relative pt-[70px]">
        {closed && (
          <div className="bg-[#FFD400] text-black text-center text-sm font-bold uppercase tracking-wide py-2 px-4" data-testid="closed-banner">
            {config.holiday_mode ? "We're on holiday — bookings are temporarily closed." : "Bookings are currently closed. Please check back soon."}
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 lg:pt-16 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FFD400]/40 bg-[#FFD400]/10 text-[#FFD400] text-xs uppercase tracking-[0.2em] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFD400] animate-pulse" /> Multi-Brand EV Workshop
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight mb-5">
              Book Your <span className="text-[#FFD400]">Scooter Service</span>
            </h1>
            <p className="text-base text-white/60 max-w-md mb-8 leading-relaxed">
              Expert care for Ola, Ather, TVS, Hero, Bajaj Chetak & more. Pick a slot, tell us the issue, and we'll take care of the rest — right here in Bangalore.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/book">
                <Button className="h-12 px-6 rounded-md bg-[#FFD400] text-black font-bold uppercase hover:bg-[#E6BE00] transition-colors" data-testid="book-now-btn">
                  <CalendarCheck className="mr-2 h-4 w-4" /> Book Now
                </Button>
              </Link>
              <a href={`tel:${PHONE}`}>
                <Button variant="outline" className="h-12 px-6 rounded-md border-white/20 bg-transparent hover:bg-white/5 text-white font-semibold" data-testid="call-now-btn">
                  <Phone className="mr-2 h-4 w-4 text-[#FFD400]" /> Call Now
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-white/50">
              {[{ i: Truck, t: "Pickup & Drop" }, { i: ShieldCheck, t: "Genuine Parts" }, { i: Award, t: "Service Warranty" }, { i: IndianRupee, t: "Fair Pricing" }].map((f) => (
                <span key={f.t} className="flex items-center gap-2"><f.i className="h-4 w-4 text-[#FFD400]" /> {f.t}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }} className="relative">
            <div className="absolute -inset-6 bg-[#FFD400]/10 blur-3xl rounded-full" />
            <img src={HERO_IMG} alt="Electric scooter" className="relative rounded-xl border border-white/10 w-full object-cover h-[420px]" data-testid="hero-image" />
            <div className="absolute bottom-4 left-4 bg-black/85 backdrop-blur border border-[#FFD400]/40 rounded-lg px-4 py-3 flex items-center gap-3">
              <Phone className="h-7 w-7 text-[#FFD400]" />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-white/60">Call for Bookings</div>
                <div className="font-display font-black text-xl text-[#FFD400] leading-none">{PHONE}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-3">Brands We Service</h2>
          <p className="text-white/50 mb-10 max-w-md">Certified technicians for every major electric & petrol two-wheeler brand.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BRANDS.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-[#121212] border border-white/10 rounded-lg p-6 hover:-translate-y-0.5 hover:border-[#FFD400]/40 transition-transform flex items-center gap-4"
                data-testid={`brand-card-${i}`}
              >
                <div className="h-12 w-12 rounded-md bg-[#FFD400]/10 flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 text-[#FFD400]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg leading-none">{b.name}</h3>
                  <p className="text-sm text-white/50 mt-1">{b.tag}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {[{ i: Wrench, t: "General Service", d: "Full checkup & tuning" }, { i: Zap, t: "Battery & Motor", d: "Diagnostics & repair" }, { i: Clock, t: "Same-Day Repairs", d: "Fast turnaround" }].map((s) => (
              <div key={s.t} className="bg-[#121212] border border-white/10 rounded-lg p-6">
                <s.i className="h-7 w-7 text-[#FFD400] mb-3" />
                <h3 className="font-display font-bold text-lg">{s.t}</h3>
                <p className="text-sm text-white/50 mt-1">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-3">What Customers Say</h2>
          <p className="text-white/50 mb-10 max-w-md">Real riders. Real repairs. Real reviews.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {REVIEWS.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#121212] border border-white/10 rounded-lg p-6"
                data-testid={`review-${i}`}
              >
                <Quote className="h-7 w-7 text-[#FFD400] mb-3" />
                <p className="text-white/80 text-sm leading-relaxed mb-4">"{r.text}"</p>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: r.stars }).map((_, k) => (
                    <Star key={k} className="h-4 w-4 text-[#FFD400]" fill="#FFD400" />
                  ))}
                </div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-white/40">{r.area}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 bg-[#FFD400] rounded-xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-black">
            <div>
              <h3 className="font-display font-black text-2xl sm:text-3xl">Ready to fix your ride?</h3>
              <p className="font-medium opacity-80 mt-1">Book a slot in under a minute.</p>
            </div>
            <Link to="/book">
              <Button className="h-12 px-7 rounded-md bg-black text-white font-bold uppercase hover:bg-black/85" data-testid="cta-book-btn">
                Book Service <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-white/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-[#FFD400] flex items-center justify-center">
              <Wrench className="h-5 w-5 text-black" strokeWidth={2.5} />
            </div>
            <span>© 2026 Machine Workshop — Multi Brand Two Wheeler Service, Bangalore</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={`tel:${PHONE}`} className="flex items-center gap-2 hover:text-white transition-colors"><Phone className="h-4 w-4" /> {PHONE}</a>
            <Link to="/login" className="hover:text-white transition-colors">Owner Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
