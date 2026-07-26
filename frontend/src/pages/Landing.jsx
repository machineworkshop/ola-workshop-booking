import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { api, formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Wrench,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Bike,
  MapPin,
  Phone,
  Star,
  Truck,
  Award,
  IndianRupee,
  Users,
  MessageCircle,
  Zap,
} from "lucide-react";

const LIME = "#A3E635";
const HERO_IMG =
  "https://customer-assets-agu9un31.emergentagent.net/job_ola-workshop-booking/artifacts/5xg4uxt0_5B9DB921-15F6-48CF-A523-23D10BB3282F.png";
const PHONE = "7019452497";

const BRANDS = ["Ola Electric", "Ather", "TVS iQube", "Bajaj Chetak", "Hero Vida", "Ampere", "Honda", "Yamaha", "Suzuki", "Other"];
const BRAND_LOGOS = ["OLA", "TVS", "BAJAJ", "HONDA", "YAMAHA", "SUZUKI", "HERO", "ATHER", "& MORE"];

const NAV = [
  { label: "Home", href: "#top" },
  { label: "Services", href: "#services" },
  { label: "Book Service", href: "#book" },
  { label: "Track Repair", href: "#book" },
  { label: "About Us", href: "#services" },
  { label: "Contact", href: "#contact" },
];

const EMPTY = {
  customer_name: "",
  place: "",
  phone: "",
  scooter_brand: "",
  scooter_model: "",
  scooter_issue: "",
  preferred_date: "",
};

export default function Landing() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/bookings", form);
      toast.success("Booking received! Our workshop will contact you shortly.");
      setDone(true);
      setForm(EMPTY);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to submit booking");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div id="top" className="min-h-screen bg-black text-white font-sans">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[70px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3" data-testid="brand-logo">
            <div className="h-11 w-11 rounded-md bg-[#FF5A1F] flex items-center justify-center shrink-0">
              <Wrench className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="font-display font-black text-lg sm:text-xl tracking-tight">MACHINE WORKSHOP</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-white/50 mt-1">Multi Brand Two Wheeler Service</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-7">
            {NAV.map((n, i) => (
              <a
                key={n.label}
                href={n.href}
                className={`text-sm font-medium uppercase tracking-wide transition-colors ${i === 0 ? "text-[#FF5A1F]" : "text-white/70 hover:text-white"}`}
                data-testid={`nav-${n.label.toLowerCase().replace(/ /g, "-")}`}
              >
                {n.label}
              </a>
            ))}
          </div>

          <Link to="/login" data-testid="owner-login-link">
            <Button variant="outline" className="h-10 rounded-md border-[#FF5A1F]/60 bg-transparent hover:bg-[#FF5A1F]/10 text-white text-sm font-semibold">
              <Users className="h-4 w-4 mr-2" /> Owner Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-[70px] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 lg:pt-8"
        >
          <div className="relative rounded-xl overflow-hidden border border-white/10">
            <img src={HERO_IMG} alt="Machine Workshop — Multi Brand Two Wheeler Service" className="w-full object-cover" data-testid="hero-image" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <a href="#book">
              <Button className="h-12 px-7 rounded-md bg-[#A3E635] text-black font-bold uppercase hover:bg-[#8CC91A] transition-colors" data-testid="hero-book-btn">
                Book a Service <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href={`https://wa.me/91${PHONE}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="h-12 px-7 rounded-md border-white/20 bg-transparent hover:bg-white/5 text-white font-semibold" data-testid="hero-whatsapp-btn">
                <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" /> WhatsApp {PHONE}
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Brand strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-white/50 mb-4">We Service All Major Brands</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 bg-[#0E0E0E] border border-white/10 rounded-lg py-5 px-4">
            {BRAND_LOGOS.map((b) => (
              <span key={b} className="font-display font-black text-base sm:text-lg text-white/80" data-testid={`brand-logo-${b}`}>{b}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: ShieldCheck, top: "500+", bottom: "Happy Customers" },
            { icon: Wrench, top: "Expert", bottom: "Certified Technicians" },
            { icon: Clock, top: "45 Min", bottom: "Average Response" },
            { icon: Star, top: "4.9 ★", bottom: "Customer Rating" },
            { icon: MapPin, top: "Bangalore", bottom: "Local Service, Fast Response" },
          ].map((s, i) => (
            <div key={i} className="bg-[#0E0E0E] border border-white/10 rounded-lg p-4 flex items-center gap-3" data-testid={`stat-${i}`}>
              <s.icon className="h-6 w-6 text-[#A3E635] shrink-0" />
              <div>
                <div className="font-display font-black text-lg leading-none">{s.top}</div>
                <div className="text-[11px] uppercase tracking-wide text-white/50 mt-1">{s.bottom}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-3 mb-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/10 pt-5">
            {[
              { icon: Truck, t: "Pickup & Drop Available" },
              { icon: ShieldCheck, t: "Genuine Spare Parts" },
              { icon: Award, t: "Warranty On Service" },
              { icon: IndianRupee, t: "Transparent Pricing" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-[#A3E635]">
                <f.icon className="h-4 w-4" /> {f.t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-3">Why Machine Workshop</h2>
          <p className="text-white/50 mb-10 max-w-md">Certified technicians, genuine parts, transparent pricing — for every brand.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Wrench, t: "All Brands", d: "Ola, Ather, TVS, Bajaj, Honda & more" },
              { icon: ShieldCheck, t: "Genuine Parts", d: "Warranty-backed components" },
              { icon: Clock, t: "Fast Turnaround", d: "Most repairs done same day" },
              { icon: Zap, t: "EV & Battery Experts", d: "Diagnostics & health checks" },
            ].map((s, i) => (
              <motion.div
                key={s.t}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#0E0E0E] border border-white/10 rounded-lg p-6 hover:-translate-y-0.5 hover:border-[#A3E635]/40 transition-transform"
                data-testid={`service-card-${i}`}
              >
                <s.icon className="h-7 w-7 text-[#A3E635] mb-4" />
                <h3 className="font-display font-bold text-lg mb-1">{s.t}</h3>
                <p className="text-sm text-white/50">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking */}
      <section id="book" className="py-20 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-3">Book Your Service</h2>
          <p className="text-white/50 mb-10">Fill in the details below. We'll confirm your slot over a call or WhatsApp.</p>

          {done ? (
            <div className="bg-[#0E0E0E] border border-[#A3E635]/40 rounded-lg p-10 text-center" data-testid="booking-success">
              <CheckCircle2 className="h-14 w-14 text-[#A3E635] mx-auto mb-4" />
              <h3 className="font-display font-bold text-2xl mb-2">Booking Confirmed!</h3>
              <p className="text-white/60 mb-6">Thanks for choosing Machine Workshop. Our team will reach out shortly to confirm your service slot.</p>
              <Button onClick={() => setDone(false)} className="rounded-md bg-[#A3E635] text-black font-bold hover:bg-[#8CC91A]" data-testid="new-booking-btn">
                Book Another
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-[#0E0E0E] border border-white/10 rounded-lg p-6 sm:p-8 space-y-5" data-testid="booking-form">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><Bike className="h-3.5 w-3.5" /> Customer Name</Label>
                  <Input required value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="e.g. Ravi Kumar" className="bg-black border-white/15 focus-visible:ring-[#A3E635] rounded-md h-11" data-testid="input-customer-name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone Number</Label>
                  <Input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 9876543210" className="bg-black border-white/15 focus-visible:ring-[#A3E635] rounded-md h-11" data-testid="input-phone" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Place / Location</Label>
                <Input required value={form.place} onChange={(e) => set("place", e.target.value)} placeholder="e.g. Indiranagar, Bengaluru" className="bg-black border-white/15 focus-visible:ring-[#A3E635] rounded-md h-11" data-testid="input-place" />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Scooter Brand</Label>
                  <Select value={form.scooter_brand} onValueChange={(v) => set("scooter_brand", v)} required>
                    <SelectTrigger className="bg-black border-white/15 focus:ring-[#A3E635] rounded-md h-11" data-testid="select-brand">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0E0E0E] border-white/15 text-white">
                      {BRANDS.map((b) => (
                        <SelectItem key={b} value={b} className="focus:bg-[#A3E635]/10 focus:text-[#A3E635]" data-testid={`brand-option-${b}`}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Scooter Model</Label>
                  <Input required value={form.scooter_model} onChange={(e) => set("scooter_model", e.target.value)} placeholder="e.g. S1 Pro" className="bg-black border-white/15 focus-visible:ring-[#A3E635] rounded-md h-11" data-testid="input-model" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Scooter Issue</Label>
                <Textarea required value={form.scooter_issue} onChange={(e) => set("scooter_issue", e.target.value)} placeholder="Describe the problem you're facing..." rows={4} className="bg-black border-white/15 focus-visible:ring-[#A3E635] rounded-md resize-none" data-testid="input-issue" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Preferred Service Date</Label>
                <Input required type="date" min={today} value={form.preferred_date} onChange={(e) => set("preferred_date", e.target.value)} className="bg-black border-white/15 focus-visible:ring-[#A3E635] rounded-md h-11 [color-scheme:dark]" data-testid="input-date" />
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-12 rounded-md bg-[#A3E635] text-black font-bold uppercase hover:bg-[#8CC91A] transition-colors disabled:opacity-60" data-testid="submit-booking-button">
                {submitting ? "Submitting..." : "Confirm Booking"}
              </Button>
            </form>
          )}
        </div>
      </section>

      <footer id="contact" className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-white/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-[#FF5A1F] flex items-center justify-center">
              <Wrench className="h-5 w-5 text-white" strokeWidth={2.5} />
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
