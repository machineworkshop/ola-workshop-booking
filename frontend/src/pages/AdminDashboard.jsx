import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Wrench, LogOut, Loader2, RefreshCw, Phone, MapPin, Inbox, Search,
  Check, X, Plus, Trash2, CalendarClock, Power,
} from "lucide-react";

const STATUSES = ["Pending", "Accepted", "Rejected", "In Progress", "Completed"];

const statusStyle = {
  Pending: "bg-[#FFA50022] text-[#FFB84D] border-[#FFA50044]",
  Accepted: "bg-[#00A3FF22] text-[#4DB8FF] border-[#00A3FF44]",
  Rejected: "bg-[#FF3B3022] text-[#FF7A73] border-[#FF3B3044]",
  "In Progress": "bg-[#B266FF22] text-[#C79BFF] border-[#B266FF44]",
  Completed: "bg-[#FFD40022] text-[#FFD400] border-[#FFD40044]",
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0 });
  const [slots, setSlots] = useState([]);
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState("");
  const [tab, setTab] = useState("bookings");

  const loadBookings = useCallback(async (q = "") => {
    const [b, s] = await Promise.all([
      api.get(`/bookings${q ? `?search=${encodeURIComponent(q)}` : ""}`),
      api.get("/bookings/stats"),
    ]);
    setBookings(b.data);
    setStats(s.data);
  }, []);

  const loadAll = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [sl, st] = await Promise.all([api.get("/slots"), api.get("/settings")]);
      setSlots(sl.data);
      setSettings(st.data);
      await loadBookings();
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [loadBookings]);

  useEffect(() => { loadAll(true); }, [loadAll]);

  const doLogout = async () => { await logout(); navigate("/login", { replace: true }); };

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success(`Marked ${status}`);
      loadBookings(search);
    } catch (e) { toast.error("Failed to update"); }
  };

  const runSearch = (e) => { e.preventDefault(); loadBookings(search); };

  // Slots
  const addSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.trim()) return;
    try {
      await api.post("/slots", { label: newSlot.trim() });
      setNewSlot("");
      toast.success("Slot created");
      loadAll();
    } catch (e) { toast.error("Failed to create slot"); }
  };
  const toggleSlot = async (id, is_open) => {
    try { await api.patch(`/slots/${id}`, { is_open }); loadAll(); }
    catch (e) { toast.error("Failed to update slot"); }
  };
  const removeSlot = async (id) => {
    try { await api.delete(`/slots/${id}`); toast.success("Slot removed"); loadAll(); }
    catch (e) { toast.error("Failed to remove slot"); }
  };

  // Settings
  const saveSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      const payload = {
        is_available: next.is_available,
        holiday_mode: next.holiday_mode,
        working_hours: next.working_hours,
        max_bookings_per_slot: Number(next.max_bookings_per_slot) || 1,
        service_areas: next.service_areas,
      };
      const { data } = await api.put("/settings", payload);
      setSettings(data);
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Failed to save"); }
  };

  if (loading || !settings) {
    return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-[#FFD400]" /></div>;
  }

  const statCards = [
    { label: "Total", value: stats.total },
    { label: "Pending", value: stats.Pending || 0 },
    { label: "Accepted", value: stats.Accepted || 0 },
    { label: "In Progress", value: stats["In Progress"] || 0 },
    { label: "Completed", value: stats.Completed || 0 },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-black/85 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-[#FFD400] flex items-center justify-center"><Wrench className="h-5 w-5 text-black" strokeWidth={2.5} /></div>
            <span className="font-display font-black text-lg tracking-tight">MACHINE WORKSHOP</span>
            <span className="ml-3 text-xs uppercase tracking-[0.2em] text-white/40 hidden sm:inline">Owner</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-md border border-white/15 bg-white/5" data-testid="availability-toggle">
              <Power className={`h-4 w-4 ${settings.is_available ? "text-[#FFD400]" : "text-white/40"}`} />
              <span className="text-xs uppercase tracking-wide text-white/70">{settings.is_available ? "Open" : "Closed"}</span>
              <Switch checked={settings.is_available} onCheckedChange={(v) => saveSettings({ is_available: v })} />
            </div>
            <Button onClick={doLogout} variant="outline" className="h-9 rounded-md border-white/20 bg-transparent hover:bg-white/5 text-white text-sm" data-testid="logout-btn"><LogOut className="h-4 w-4 mr-1.5" /> Logout</Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#121212] border border-white/10 rounded-md p-1 mb-6">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-[#FFD400] data-[state=active]:text-black rounded-sm px-4" data-testid="tab-bookings">Bookings</TabsTrigger>
            <TabsTrigger value="slots" className="data-[state=active]:bg-[#FFD400] data-[state=active]:text-black rounded-sm px-4" data-testid="tab-slots">Service Slots</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#FFD400] data-[state=active]:text-black rounded-sm px-4" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          {/* BOOKINGS */}
          <TabsContent value="bookings">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {statCards.map((c) => (
                <div key={c.label} className="bg-[#121212] border border-white/10 rounded-lg p-4" data-testid={`stat-${c.label.toLowerCase().replace(/ /g, "-")}`}>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40">{c.label}</div>
                  <div className="font-display font-black text-2xl mt-1">{c.value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <form onSubmit={runSearch} className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer name or phone..." className="pl-9 bg-[#121212] border-white/15 focus-visible:ring-[#FFD400] rounded-md h-10" data-testid="search-input" />
                </div>
                <Button type="submit" className="h-10 rounded-md bg-[#FFD400] text-black font-semibold hover:bg-[#E6BE00]" data-testid="search-btn">Search</Button>
                {search && <Button type="button" variant="outline" onClick={() => { setSearch(""); loadBookings(""); }} className="h-10 rounded-md border-white/20 bg-transparent text-white">Clear</Button>}
              </form>
              <Button onClick={() => loadBookings(search)} variant="outline" className="h-10 rounded-md border-white/20 bg-transparent hover:bg-white/5 text-white" data-testid="refresh-btn"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
            </div>

            <div className="bg-[#121212] border border-white/10 rounded-lg overflow-hidden">
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/40" data-testid="empty-state"><Inbox className="h-10 w-10 mb-3" /><p>No bookings found.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table data-testid="orders-table">
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        {["Customer", "Scooter", "Issue", "Location", "Slot", "Status", "Actions"].map((h) => (
                          <TableHead key={h} className="text-white/40 uppercase text-xs tracking-wider">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((b) => (
                        <TableRow key={b.id} className="border-white/10 hover:bg-white/5" data-testid={`order-row-${b.id}`}>
                          <TableCell>
                            <div className="font-medium">{b.customer_name}</div>
                            <a href={`tel:${b.phone}`} className="text-xs text-white/40 flex items-center gap-1 mt-0.5 hover:text-[#FFD400]"><Phone className="h-3 w-3" />{b.phone}</a>
                          </TableCell>
                          <TableCell className="text-white/70"><div className="font-medium text-[#FFD400]">{b.scooter_brand}</div><div className="text-xs text-white/40">{b.scooter_model}</div></TableCell>
                          <TableCell className="text-white/70 max-w-[200px]"><div className="truncate" title={b.scooter_issue}>{b.scooter_issue}</div></TableCell>
                          <TableCell className="text-white/70"><div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-white/40" />{b.location}</div>{b.landmark && <div className="text-xs text-white/40 mt-0.5">{b.landmark}</div>}</TableCell>
                          <TableCell className="text-white/70 whitespace-nowrap text-sm">{b.slot_label}</TableCell>
                          <TableCell><Badge className={`rounded-sm border ${statusStyle[b.status]} font-medium`} data-testid={`status-badge-${b.id}`}>{b.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {b.status === "Pending" && (
                                <>
                                  <Button size="sm" onClick={() => changeStatus(b.id, "Accepted")} className="h-8 rounded-md bg-[#FFD400] text-black font-semibold hover:bg-[#E6BE00]" data-testid={`accept-btn-${b.id}`}><Check className="h-4 w-4" /></Button>
                                  <Button size="sm" onClick={() => changeStatus(b.id, "Rejected")} variant="outline" className="h-8 rounded-md border-[#FF3B30]/50 text-[#FF7A73] hover:bg-[#FF3B30]/10 bg-transparent" data-testid={`reject-btn-${b.id}`}><X className="h-4 w-4" /></Button>
                                </>
                              )}
                              <Select value={b.status} onValueChange={(v) => changeStatus(b.id, v)}>
                                <SelectTrigger className="w-[130px] h-8 bg-black border-white/15 rounded-md focus:ring-[#FFD400] text-xs" data-testid={`status-select-${b.id}`}><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#141414] border-white/15 text-white">
                                  {STATUSES.map((s) => (<SelectItem key={s} value={s} className="focus:bg-[#FFD400]/10 focus:text-[#FFD400]" data-testid={`status-opt-${b.id}-${s}`}>{s}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* SLOTS */}
          <TabsContent value="slots">
            <div className="max-w-2xl">
              <h2 className="font-display font-black text-2xl tracking-tight mb-1">Service Slots</h2>
              <p className="text-white/50 text-sm mb-6">Create slots and toggle them ON/OFF. Customers only see slots that are ON and not full.</p>

              <form onSubmit={addSlot} className="flex gap-2 mb-6">
                <Input value={newSlot} onChange={(e) => setNewSlot(e.target.value)} placeholder="e.g. 10:00 AM - 11:00 AM" className="bg-[#121212] border-white/15 focus-visible:ring-[#FFD400] rounded-md h-11" data-testid="new-slot-input" />
                <Button type="submit" className="h-11 rounded-md bg-[#FFD400] text-black font-bold hover:bg-[#E6BE00]" data-testid="add-slot-btn"><Plus className="h-4 w-4 mr-1" /> Add Slot</Button>
              </form>

              {slots.length === 0 ? (
                <div className="bg-[#121212] border border-white/10 rounded-lg p-10 text-center text-white/40" data-testid="no-slots-admin"><CalendarClock className="h-10 w-10 mx-auto mb-3" /><p>No slots yet. Create one above.</p></div>
              ) : (
                <div className="space-y-3">
                  {slots.map((s) => (
                    <div key={s.id} className="bg-[#121212] border border-white/10 rounded-lg p-4 flex items-center justify-between" data-testid={`slot-row-${s.id}`}>
                      <div className="flex items-center gap-3">
                        <CalendarClock className="h-5 w-5 text-[#FFD400]" />
                        <div>
                          <div className="font-semibold">{s.label}</div>
                          <div className="text-xs text-white/40">{s.booked} active booking{s.booked === 1 ? "" : "s"} · max {settings.max_bookings_per_slot}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs uppercase tracking-wide ${s.is_open ? "text-[#FFD400]" : "text-white/40"}`}>{s.is_open ? "ON" : "OFF"}</span>
                          <Switch checked={s.is_open} onCheckedChange={(v) => toggleSlot(s.id, v)} data-testid={`slot-toggle-${s.id}`} />
                        </div>
                        <Button size="sm" variant="outline" onClick={() => removeSlot(s.id)} className="h-8 rounded-md border-[#FF3B30]/50 text-[#FF7A73] hover:bg-[#FF3B30]/10 bg-transparent" data-testid={`delete-slot-${s.id}`}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings">
            <div className="max-w-2xl space-y-4">
              <h2 className="font-display font-black text-2xl tracking-tight mb-1">Settings</h2>
              <p className="text-white/50 text-sm mb-4">Control availability, working hours and capacity.</p>

              <div className="bg-[#121212] border border-white/10 rounded-lg p-5 flex items-center justify-between">
                <div><div className="font-semibold">Available for Bookings</div><div className="text-sm text-white/40">Master ON/OFF switch shown to customers.</div></div>
                <Switch checked={settings.is_available} onCheckedChange={(v) => saveSettings({ is_available: v })} data-testid="setting-available" />
              </div>

              <div className="bg-[#121212] border border-white/10 rounded-lg p-5 flex items-center justify-between">
                <div><div className="font-semibold">Holiday Mode</div><div className="text-sm text-white/40">Temporarily pause all bookings.</div></div>
                <Switch checked={settings.holiday_mode} onCheckedChange={(v) => saveSettings({ holiday_mode: v })} data-testid="setting-holiday" />
              </div>

              <div className="bg-[#121212] border border-white/10 rounded-lg p-5">
                <div className="font-semibold mb-3">Working Hours</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs uppercase tracking-wide text-white/60">Open</Label><Input type="time" value={settings.working_hours?.open || ""} onChange={(e) => setSettings({ ...settings, working_hours: { ...settings.working_hours, open: e.target.value } })} onBlur={() => saveSettings({})} className="bg-black border-white/15 rounded-md h-11 [color-scheme:dark] focus-visible:ring-[#FFD400]" data-testid="setting-open" /></div>
                  <div className="space-y-2"><Label className="text-xs uppercase tracking-wide text-white/60">Close</Label><Input type="time" value={settings.working_hours?.close || ""} onChange={(e) => setSettings({ ...settings, working_hours: { ...settings.working_hours, close: e.target.value } })} onBlur={() => saveSettings({})} className="bg-black border-white/15 rounded-md h-11 [color-scheme:dark] focus-visible:ring-[#FFD400]" data-testid="setting-close" /></div>
                </div>
              </div>

              <div className="bg-[#121212] border border-white/10 rounded-lg p-5">
                <div className="font-semibold mb-3">Maximum Bookings Per Slot</div>
                <Input type="number" min={1} value={settings.max_bookings_per_slot} onChange={(e) => setSettings({ ...settings, max_bookings_per_slot: e.target.value })} onBlur={() => saveSettings({})} className="bg-black border-white/15 rounded-md h-11 w-32 focus-visible:ring-[#FFD400]" data-testid="setting-max" />
              </div>

              <div className="bg-[#121212] border border-white/10 rounded-lg p-5">
                <div className="font-semibold mb-1">Service Areas</div>
                <div className="text-sm text-white/40 mb-3">Comma-separated list of areas you serve.</div>
                <Input value={(settings.service_areas || []).join(", ")} onChange={(e) => setSettings({ ...settings, service_areas: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} onBlur={() => saveSettings({})} placeholder="Indiranagar, HSR Layout, Whitefield" className="bg-black border-white/15 rounded-md h-11 focus-visible:ring-[#FFD400]" data-testid="setting-areas" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
