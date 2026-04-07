import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "owner">("user");
  const [error, setError] = useState("");
  const register = useRegister();
  const { refetch } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register.mutateAsync({ data: { name, email, password, role } });
      queryClient.invalidateQueries();
      refetch();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join Pakistan's trusted event venue marketplace</p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["user", "owner"] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${role === r ? "bg-primary border-primary text-white" : "bg-card border-border text-foreground hover:border-primary/50"}`}
                  >
                    {r === "user" ? "Venue Seeker" : "Venue Owner"}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" disabled={register.isPending}>
              {register.isPending ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
