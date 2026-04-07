import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, LayoutDashboard } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout.mutateAsync({});
    queryClient.clear();
    navigate("/");
  };

  return (
    <header className="bg-secondary text-secondary-foreground sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="font-bold text-lg tracking-tight">ZeroAgent</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/venues" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
              Event Spaces
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors flex items-center gap-1">
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-secondary-foreground/70 flex items-center gap-1">
                    <User size={14} /> {user.name}
                  </span>
                  <Button size="sm" variant="outline" onClick={handleLogout} className="border-secondary-foreground/30 text-secondary-foreground hover:bg-primary hover:text-white hover:border-primary transition-all">
                    <LogOut size={14} />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button size="sm" variant="ghost" className="text-secondary-foreground/80 hover:text-primary">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">Sign Up</Button>
                </Link>
              </div>
            )}
          </nav>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-secondary-foreground/10 space-y-3">
            <Link href="/venues" className="block text-sm text-secondary-foreground/80 hover:text-primary py-2" onClick={() => setMenuOpen(false)}>Event Spaces</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block text-sm text-secondary-foreground/80 hover:text-primary py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button onClick={handleLogout} className="block text-sm text-secondary-foreground/70 hover:text-destructive py-2">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block" onClick={() => setMenuOpen(false)}><Button size="sm" variant="ghost" className="w-full text-secondary-foreground/80">Login</Button></Link>
                <Link href="/register" className="block" onClick={() => setMenuOpen(false)}><Button size="sm" className="w-full bg-primary text-white">Sign Up</Button></Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
