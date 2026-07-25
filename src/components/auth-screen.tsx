import { useState } from "react";
import { signIn, signUp, fileToDataUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "./user-avatar";
import { Camera, Users } from "lucide-react";
import { toast } from "sonner";

export function AuthScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") signIn(username, password);
      else signUp({ username, password, displayName, bio, avatar });
      toast.success(mode === "in" ? "Welcome back" : "Account created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function onAvatar(f: File | undefined) {
    if (!f) return;
    setAvatar(await fileToDataUrl(f));
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-8 bg-gradient-to-br from-background via-background to-accent/40">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-pop mb-3">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">LANbook</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A little social space, right on your network.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl bg-card shadow-pop p-6 space-y-4"
        >
          <div className="flex bg-muted rounded-full p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("in")}
              className={`flex-1 py-2 rounded-full transition-colors ${
                mode === "in" ? "bg-background shadow" : "text-muted-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("up")}
              className={`flex-1 py-2 rounded-full transition-colors ${
                mode === "up" ? "bg-background shadow" : "text-muted-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          {mode === "up" && (
            <div className="flex flex-col items-center gap-2">
              <label className="relative cursor-pointer">
                <UserAvatar user={{ displayName: displayName || "?", avatar }} size={80} />
                <span className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center shadow">
                  <Camera className="h-3.5 w-3.5" />
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onAvatar(e.target.files?.[0])}
                />
              </label>
              <p className="text-xs text-muted-foreground">Tap to add a profile photo</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 4 characters"
              required
            />
          </div>

          {mode === "up" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="dn">Display name</Label>
                <Input
                  id="dn"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short intro (optional)"
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full rounded-full h-11" disabled={busy}>
            {mode === "in" ? "Sign in" : "Create account"}
          </Button>

          {mode === "in" && (
            <p className="text-center text-xs text-muted-foreground">
              Demo accounts: <span className="font-mono">alex / demo</span> ·{" "}
              <span className="font-mono">maya / demo</span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
