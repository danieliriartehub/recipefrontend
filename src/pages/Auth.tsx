import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon } from "lucide-react";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const nav = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(mode === "login" ? "¡Bienvenida de vuelta! 🌱" : "Cuenta creada · ¡A reciclar!");
    nav("/app");
  };

  return (
    <MobileShell hideNav>
      <ScreenHeader title={mode === "login" ? "Inicia sesión" : "Crea tu cuenta"} subtitle="Únete a la comunidad RECIPE" back />

      <div className="px-5 pt-2">
        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-muted p-1">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMode(t)}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-smooth ${
                mode === t ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "login" ? "Ingresar" : "Registrarme"}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          className="h-12 w-full rounded-2xl border-2 font-semibold"
          onClick={() => {
            toast.success("Sesión iniciada con Google");
            nav("/app");
          }}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          Continuar con Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> o con tu correo <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input id="name" required placeholder="Camila Rojas" className="h-12 rounded-xl pl-10" />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo universitario</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" required placeholder="tu.correo@universidad.edu.pe" className="h-12 rounded-xl pl-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pass">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input id="pass" type="password" required placeholder="••••••••" className="h-12 rounded-xl pl-10" />
            </div>
          </div>

          <Button type="submit" size="lg" className="h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-glow">
            {mode === "login" ? "Ingresar a RECIPE" : "Crear mi cuenta"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Al continuar aceptas nuestros <Link to="#" className="text-primary font-medium">Términos</Link> y{" "}
          <Link to="#" className="text-primary font-medium">Privacidad</Link>.
        </p>
      </div>
    </MobileShell>
  );
};

export default Auth;
