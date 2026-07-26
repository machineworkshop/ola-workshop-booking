import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Wrench, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) navigate("/admin", { replace: true });
    else setError(res.error);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6 font-sans">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors" data-testid="back-home-link">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-md bg-[#FF5A1F] flex items-center justify-center">
            <Wrench className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-black text-lg tracking-tight">MACHINE WORKSHOP</span>
        </div>

        <h1 className="font-display font-black text-3xl tracking-tighter mb-2">Admin Login</h1>
        <p className="text-white/50 text-sm mb-8">Sign in to manage service orders.</p>

        <form onSubmit={submit} className="bg-[#0E0E0E] border border-white/10 rounded-lg p-6 space-y-5" data-testid="login-form">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@workshop.com" className="bg-black border-white/15 focus-visible:ring-[#A3E635] rounded-md h-11" data-testid="login-email" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.2em] text-white/60">Password</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-black border-white/15 focus-visible:ring-[#A3E635] rounded-md h-11" data-testid="login-password" />
          </div>
          {error && <p className="text-sm text-[#FF3B30]" data-testid="login-error">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full h-11 rounded-md bg-[#A3E635] text-black font-bold hover:bg-[#8CC91A] transition-colors" data-testid="login-submit">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
