import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useLogin();
  const { refetch } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login.mutateAsync({ data: { email, password } });
      queryClient.invalidateQueries();
      refetch();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your ZeroAgent account</p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" disabled={login.isPending}>
              {login.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">Create one</Link>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Demo: admin@zeroagent.pk / bilal@zeroagent.pk / ahmed@zeroagent.pk — password: <strong>password</strong>
        </p>
      </div>
    </div>
  );
}
