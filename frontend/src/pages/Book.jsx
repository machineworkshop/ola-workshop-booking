import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { api, formatApiErrorDetail } from "../lib/api";
import { SiteNav, PHONE } from "../components/SiteNav";
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
import { User, Phone, MapPin, Bike, CheckCircle2, CalendarClock, Loader2, AlertCircle } from "lucide-react";

const BRANDS = ["Ola Electric", "Ather", "TVS iQube", "Bajaj Chetak", "Hero Vida", "Ampere", "Honda", "Yamaha", "Suzuki", "Other"];

const EMPTY = {
  customer_name: "",
  phone: "",
  scooter_brand: "",
  scooter_model: "",
  scooter_issue: "",
  location: "",
  landmark: "",
  slot_id: "",
  slot_label: "",
};

export default function Book() {
  const [form, setForm] = useState(EMPTY);
  const [slots, setSlots] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([api.get("/config"), api.get("/slots/available")]);
      setConfig(c.data);
      setSlots(s.data);
    } catch (e) {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const closed = config && (!config.is_available || config.holiday_mode);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.slot_id) {
      toast.error("Please select an available slot.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/bookings", form);
      toast.success("Booking received! We'll confirm shortly.");
      setDone(true);
      setForm(EMPTY);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to submit booking");
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <SiteNav active="book" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-[110px] pb-20">
        <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-2">Book a Service</h1>
        <p className="text-white/50 mb-8">Fill in the details and pick an available slot. We'll confirm over a call.</p>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#FFD400]" /></div>
        ) : done ? (
          <div className="bg-[#121212] border border-[#FFD400]/40 rounded-lg p-10 text-center" data-testid="booking-success">
            <CheckCircle2 className="h-14 w-14 text-[#FFD400] mx-auto mb-4" />
            <h3 className="font-display font-bold text-2xl mb-2">Booking Confirmed!</h3>
            <p className="text-white/60 mb-6">Thanks for choosing Machine Workshop. Your request is <span className="text-[#FFD400] font-semibold">Pending</span> — our team will confirm your slot shortly.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => { setDone(false); loadData(); }} className="rounded-md bg-[#FFD400] text-black font-bold hover:bg-[#E6BE00]" data-testid="new-booking-btn">Book Another</Button>
              <Link to="/"><Button variant="outline" className="rounded-md border-white/20 bg-transparent text-white hover:bg-white/5">Back Home</Button></Link>
            </div>
          </div>
        ) : closed ? (
          <div className="bg-[#121212] border border-white/10 rounded-lg p-10 text-center" data-testid="closed-message">
            <AlertCircle className="h-14 w-14 text-[#FFD400] mx-auto mb-4" />
            <h3 className="font-display font-bold text-2xl mb-2">Bookings Closed</h3>
            <p className="text-white/60 mb-6">{config.holiday_mode ? "We're currently on holiday." : "We're not accepting bookings right now."} Please call us and we'll help you out.</p>
            <a href={`tel:${PHONE}`}><Button className="rounded-md bg-[#FFD400] text-black font-bold hover:bg-[#E6BE00]"><Phone className="mr-2 h-4 w-4" /> Call {PHONE}</Button></a>
          </div>
        ) : (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="bg-[#121212] border border-white/10 rounded-lg p-6 sm:p-8 space-y-5" data-testid="booking-form">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Name</Label>
                <Input required value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="e.g. Ravi Kumar" className="bg-black border-white/15 focus-visible:ring-[#FFD400] rounded-md h-11" data-testid="input-customer-name" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone Number</Label>
                <Input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 9876543210" className="bg-black border-white/15 focus-visible:ring-[#FFD400] rounded-md h-11" data-testid="input-phone" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><Bike className="h-3.5 w-3.5" /> Scooter Brand</Label>
                <Select value={form.scooter_brand} onValueChange={(v) => set("scooter_brand", v)} required>
                  <SelectTrigger className="bg-black border-white/15 focus:ring-[#FFD400] rounded-md h-11" data-testid="select-brand"><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent className="bg-[#141414] border-white/15 text-white">
                    {BRANDS.map((b) => (<SelectItem key={b} value={b} className="focus:bg-[#FFD400]/10 focus:text-[#FFD400]" data-testid={`brand-option-${b}`}>{b}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Scooter Model</Label>
                <Input required value={form.scooter_model} onChange={(e) => set("scooter_model", e.target.value)} placeholder="e.g. S1 Pro" className="bg-black border-white/15 focus-visible:ring-[#FFD400] rounded-md h-11" data-testid="input-model" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Issue Description</Label>
              <Textarea required value={form.scooter_issue} onChange={(e) => set("scooter_issue", e.target.value)} placeholder="Describe the problem..." rows={3} className="bg-black border-white/15 focus-visible:ring-[#FFD400] rounded-md resize-none" data-testid="input-issue" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location / Area</Label>
                <Input required value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Indiranagar" className="bg-black border-white/15 focus-visible:ring-[#FFD400] rounded-md h-11" data-testid="input-location" />
                {config?.service_areas?.length > 0 && (
                  <p className="text-[11px] text-white/40">We serve: {config.service_areas.join(", ")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Landmark <span className="text-white/30 normal-case tracking-normal">(optional)</span></Label>
                <Input value={form.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="e.g. Near Metro Station" className="bg-black border-white/15 focus-visible:ring-[#FFD400] rounded-md h-11" data-testid="input-landmark" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Select Available Slot</Label>
              {slots.length === 0 ? (
                <div className="bg-black border border-white/15 rounded-md p-4 text-sm text-white/50" data-testid="no-slots">No slots available right now. Please call us at {PHONE} or check back later.</div>
              ) : (
                <Select value={form.slot_id} onValueChange={(v) => { const s = slots.find((x) => x.id === v); set("slot_id", v); set("slot_label", s ? s.label : ""); }} required>
                  <SelectTrigger className="bg-black border-white/15 focus:ring-[#FFD400] rounded-md h-11" data-testid="select-slot"><SelectValue placeholder="Choose a slot" /></SelectTrigger>
                  <SelectContent className="bg-[#141414] border-white/15 text-white">
                    {slots.map((s) => (<SelectItem key={s.id} value={s.id} className="focus:bg-[#FFD400]/10 focus:text-[#FFD400]" data-testid={`slot-option-${s.id}`}>{s.label} · {s.remaining} left</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Button type="submit" disabled={submitting || slots.length === 0} className="w-full h-12 rounded-md bg-[#FFD400] text-black font-bold uppercase hover:bg-[#E6BE00] transition-colors disabled:opacity-50" data-testid="submit-booking-button">
              {submitting ? "Submitting..." : "Confirm Booking"}
            </Button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
