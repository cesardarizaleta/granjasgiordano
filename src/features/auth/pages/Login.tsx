import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoGranjasGiordano from "@/assets/granjasgiordano.jpg";
import { APP_CONFIG } from "@/constants";

const Login = () => {
  const brand = APP_CONFIG.BRAND;
  const logoSrc =
    brand.LOGO_URL && brand.LOGO_URL !== "/granjasgiordano.jpg"
      ? brand.LOGO_URL
      : logoGranjasGiordano;
  const brandName = brand.NAME || APP_CONFIG.NAME;
  const brandTagline = brand.TAGLINE || "Sistema ERP";
  const footerText = brand.FOOTER_TEXT || `Sistema de gestión • ${brandName}`;
  const gradientFrom = brand.GRADIENT_FROM || "from-primary/20";
  const gradientTo = brand.GRADIENT_TO || "to-accent/20";

  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para los valores de los inputs (para manejar autocompletado)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Obtener la ruta de redirección desde el state
  const from = location.state?.from?.pathname || "/";

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Usar los valores del estado en lugar de FormData
    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
    } else {
      navigate(from, { replace: true });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse bg-gradient-to-br ${gradientFrom} ${gradientTo}`}
        />
        <div
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 bg-gradient-to-br ${gradientFrom} ${gradientTo}`}
        />
      </div>

      <Card className="w-full max-w-md relative z-10 animate-slide-up bg-card/95 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src={logoSrc}
              alt={brandName}
              className="w-24 h-24 rounded-xl shadow-lg animate-glow"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-display font-bold">
              Bienvenido a <span className="text-primary">{brandName}</span>
            </CardTitle>
            <CardDescription>
              {brandTagline} - Gestiona tu negocio de manera eficiente
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-destructive/50 text-destructive dark:border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@granjasgiordano.com"
                required
                className="h-11"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onInput={e => setEmail((e.target as HTMLInputElement).value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="h-11 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onInput={e => setPassword((e.target as HTMLInputElement).value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">{footerText}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
