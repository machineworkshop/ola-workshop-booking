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
  Zap,
  Wrench,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Bike,
  MapPin,
  Phone,
} from "lucide-react";

const BRANDS = ["Ola Electric", "Ather", "TVS iQube", "Bajaj Chetak", "Hero Vida", "Ampere", "Bounce", "Other"];

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
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid="brand-logo">
            <div className="h-8 w-8 rounded bg-[#00FF66] flex items-center justify-center">
              <Zap className="h-5 w-5 text-black" fill="black" />
            </div>
            <span className="font-display font-black text-lg tracking-tighter">VOLT<span className="text-[#00FF66]">WORKS</span></span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#services" className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors" data-testid="nav-services">Services</a>
            <a href="#book" className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors" data-testid="nav-book">Book</a>
            <Link to="/login" data-testid="admin-login-link">
              <Button variant="outline" className="h-9 rounded-sm border-white/20 bg-transparent hover:bg-white/5 text-white text-sm">
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00FF66]/30 bg-[#00FF66]/5 text-[#00FF66] text-xs uppercase tracking-[0.2em] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FF66] animate-pulse" />
              Multi-Brand EV Workshop
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-none tracking-tighter mb-6">
              Your electric scooter,
              <span className="text-[#00FF66]"> serviced right.</span>
            </h1>
            <p className="text-base text-white/60 max-w-md mb-8 leading-relaxed">
              Expert service & repair for Ola Electric and all major EV scooter brands. Book a slot in seconds — we'll take it from there.
            </p>
            <div className="flex items-center gap-4">
              <a href="#book">
                <Button className="h-12 px-6 rounded-sm bg-[#00FF66] text-black font-semibold hover:bg-[#00CC52] transition-colors" data-testid="hero-book-btn">
                  Book a Service <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#services">
                <Button variant="outline" className="h-12 px-6 rounded-sm border-white/20 bg-transparent hover:bg-white/5 text-white">
                  Our Services
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-[#00FF66]/10 blur-3xl rounded-full" />
            <img
              src="https://images.pexels.com/photos/11263654/pexels-photo-11263654.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="Electric scooter"
              className="relative rounded-lg border border-white/10 w-full object-cover h-[420px]"
              data-testid="hero-image"
            />
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl tracking-tighter mb-3">Why Machine Workshop</h2>
          <p className="text-white/50 mb-12 max-w-md">Certified technicians, genuine parts, transparent pricing.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Wrench, t: "All Brands", d: "Ola, Ather, TVS, Bajaj & more" },
              { icon: ShieldCheck, t: "Genuine Parts", d: "Warranty-backed components" },
              { icon: Clock, t: "Fast Turnaround", d: "Most repairs done same day" },
              { icon: Zap, t: "Battery Experts", d: "Diagnostics & health checks" },
            ].map((s, i) => (
              <motion.div
                key={s.t}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#121212] border border-[#2A2A2A] rounded-sm p-6 hover:-translate-y-0.5 hover:border-[#00FF66]/40 transition-transform"
                data-testid={`service-card-${i}`}
              >
                <s.icon className="h-7 w-7 text-[#00FF66] mb-4" />
                <h3 className="font-display font-bold text-lg mb-1">{s.t}</h3>
                <p className="text-sm text-white/50">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking */}
      <section id="book" className="py-24 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl tracking-tighter mb-3">Book Your Service</h2>
          <p className="text-white/50 mb-10">Fill in the details below. We'll confirm your slot over a call.</p>

          {done ? (
            <div className="bg-[#121212] border border-[#00FF66]/40 rounded-sm p-10 text-center" data-testid="booking-success">
              <CheckCircle2 className="h-14 w-14 text-[#00FF66] mx-auto mb-4" />
              <h3 className="font-display font-bold text-2xl mb-2">Booking Confirmed!</h3>
              <p className="text-white/60 mb-6">Thanks for choosing Machine Workshop. Our team will reach out shortly to confirm your service slot.</p>
              <Button onClick={() => setDone(false)} className="rounded-sm bg-[#00FF66] text-black font-semibold hover:bg-[#00CC52]" data-testid="new-booking-btn">
                Book Another
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-[#121212] border border-[#2A2A2A] rounded-sm p-6 sm:p-8 space-y-5" data-testid="booking-form">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><Bike className="h-3.5 w-3.5" /> Customer Name</Label>
                  <Input required value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="e.g. Ravi Kumar" className="bg-[#0A0A0A] border-[#2A2A2A] focus-visible:ring-[#00FF66] rounded-sm h-11" data-testid="input-customer-name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone Number</Label>
                  <Input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 9876543210" className="bg-[#0A0A0A] border-[#2A2A2A] focus-visible:ring-[#00FF66] rounded-sm h-11" data-testid="input-phone" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Place / Location</Label>
                <Input required value={form.place} onChange={(e) => set("place", e.target.value)} placeholder="e.g. Indiranagar, Bengaluru" className="bg-[#0A0A0A] border-[#2A2A2A] focus-visible:ring-[#00FF66] rounded-sm h-11" data-testid="input-place" />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Scooter Brand</Label>
                  <Select value={form.scooter_brand} onValueChange={(v) => set("scooter_brand", v)} required>
                    <SelectTrigger className="bg-[#0A0A0A] border-[#2A2A2A] focus:ring-[#00FF66] rounded-sm h-11" data-testid="select-brand">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121212] border-[#2A2A2A] text-white">
                      {BRANDS.map((b) => (
                        <SelectItem key={b} value={b} className="focus:bg-[#00FF66]/10 focus:text-[#00FF66]" data-testid={`brand-option-${b}`}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Scooter Model</Label>
                  <Input required value={form.scooter_model} onChange={(e) => set("scooter_model", e.target.value)} placeholder="e.g. S1 Pro" className="bg-[#0A0A0A] border-[#2A2A2A] focus-visible:ring-[#00FF66] rounded-sm h-11" data-testid="input-model" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Scooter Issue</Label>
                <Textarea required value={form.scooter_issue} onChange={(e) => set("scooter_issue", e.target.value)} placeholder="Describe the problem you're facing..." rows={4} className="bg-[#0A0A0A] border-[#2A2A2A] focus-visible:ring-[#00FF66] rounded-sm resize-none" data-testid="input-issue" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Preferred Service Date</Label>
                <Input required type="date" min={today} value={form.preferred_date} onChange={(e) => set("preferred_date", e.target.value)} className="bg-[#0A0A0A] border-[#2A2A2A] focus-visible:ring-[#00FF66] rounded-sm h-11 [color-scheme:dark]" data-testid="input-date" />
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-12 rounded-sm bg-[#00FF66] text-black font-semibold hover:bg-[#00CC52] transition-colors disabled:opacity-60" data-testid="submit-booking-button">
                {submitting ? "Submitting..." : "Confirm Booking"}
              </Button>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/40">
          <span>© 2026 Machine Workshop — Multi-Brand EV Scooter Service</span>
          <Link to="/login" className="hover:text-white transition-colors">Admin Login</Link>
        </div>
      </footer>
    </div>
  );
}
