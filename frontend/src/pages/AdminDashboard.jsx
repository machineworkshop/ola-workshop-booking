import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Zap,
  LogOut,
  ClipboardList,
  Clock,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Phone,
  MapPin,
  Inbox,
} from "lucide-react";

const STATUSES = ["Pending", "In Progress", "Completed"];

const statusStyle = {
  Pending: "bg-[#FFA50022] text-[#FFB84D] border-[#FFA50044]",
  "In Progress": "bg-[#00A3FF22] text-[#4DB8FF] border-[#00A3FF44]",
  Completed: "bg-[#00FF6622] text-[#00FF66] border-[#00FF6644]",
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([api.get("/bookings"), api.get("/bookings/stats")]);
      setBookings(b.data);
      setStats(s.data);
    } catch (e) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success(`Order marked ${status}`);
      load();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const doLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const cards = [
    { label: "Total Orders", value: stats.total, icon: ClipboardList, color: "text-white" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-[#FFB84D]" },
    { label: "In Progress", value: stats.in_progress, icon: Loader2, color: "text-[#4DB8FF]" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-[#00FF66]" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      <nav className="bg-black/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-[#00FF66] flex items-center justify-center">
              <Zap className="h-5 w-5 text-black" fill="black" />
            </div>
            <span className="font-display font-black text-lg tracking-tighter">MACHINE<span className="text-[#00FF66]"> WORKSHOP</span></span>
            <span className="ml-3 text-xs uppercase tracking-[0.2em] text-white/40 hidden sm:inline">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/50 hidden sm:inline" data-testid="admin-email">{user?.email}</span>
            <Button onClick={doLogout} variant="outline" className="h-9 rounded-sm border-white/20 bg-transparent hover:bg-white/5 text-white text-sm" data-testid="logout-btn">
              <LogOut className="h-4 w-4 mr-1.5" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tighter">Service Orders</h1>
            <p className="text-white/50 text-sm mt-1">Manage and track all customer bookings.</p>
          </div>
          <Button onClick={load} variant="outline" className="h-10 rounded-sm border-white/20 bg-transparent hover:bg-white/5 text-white" data-testid="refresh-btn">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-[#121212] border border-[#2A2A2A] rounded-sm p-5"
              data-testid={`stat-${c.label.toLowerCase().replace(/ /g, "-")}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-[0.2em] text-white/40">{c.label}</span>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <div className="font-display font-black text-3xl">{c.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#00FF66]" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40" data-testid="empty-state">
              <Inbox className="h-10 w-10 mb-3" />
              <p>No service orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="orders-table">
                <TableHeader>
                  <TableRow className="border-[#2A2A2A] hover:bg-transparent">
                    <TableHead className="text-white/40 uppercase text-xs tracking-wider">Customer</TableHead>
                    <TableHead className="text-white/40 uppercase text-xs tracking-wider">Location</TableHead>
                    <TableHead className="text-white/40 uppercase text-xs tracking-wider">Scooter</TableHead>
                    <TableHead className="text-white/40 uppercase text-xs tracking-wider">Issue</TableHead>
                    <TableHead className="text-white/40 uppercase text-xs tracking-wider">Date</TableHead>
                    <TableHead className="text-white/40 uppercase text-xs tracking-wider">Status</TableHead>
                    <TableHead className="text-white/40 uppercase text-xs tracking-wider">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id} className="border-[#2A2A2A] hover:bg-white/5" data-testid={`order-row-${b.id}`}>
                      <TableCell>
                        <div className="font-medium">{b.customer_name}</div>
                        <div className="text-xs text-white/40 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{b.phone}</div>
                      </TableCell>
                      <TableCell className="text-white/70">
                        <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-white/40" />{b.place}</div>
                      </TableCell>
                      <TableCell className="text-white/70">
                        <div className="font-medium text-[#00FF66]">{b.scooter_brand}</div>
                        <div className="text-xs text-white/40">{b.scooter_model}</div>
                      </TableCell>
                      <TableCell className="text-white/70 max-w-[220px]">
                        <div className="truncate" title={b.scooter_issue}>{b.scooter_issue}</div>
                      </TableCell>
                      <TableCell className="text-white/70 whitespace-nowrap">{b.preferred_date}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-sm border ${statusStyle[b.status]} font-medium`} data-testid={`status-badge-${b.id}`}>{b.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={b.status} onValueChange={(v) => changeStatus(b.id, v)}>
                          <SelectTrigger className="w-[140px] h-9 bg-[#0A0A0A] border-[#2A2A2A] rounded-sm focus:ring-[#00FF66]" data-testid={`status-select-${b.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#121212] border-[#2A2A2A] text-white">
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="focus:bg-[#00FF66]/10 focus:text-[#00FF66]" data-testid={`status-opt-${b.id}-${s}`}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
