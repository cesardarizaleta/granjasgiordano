import { useDolar } from "@/hooks/useDolar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DollarSign, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DolarDisplay() {
  const { oficialRate, loading, error, refreshRates, showInUSD, setShowInUSD } = useDolar();

  const handleRefresh = async () => {
    await refreshRates();
    toast.success("Tasas de dólar actualizadas");
  };

  return (
    <div className="flex items-center gap-4">
      {/* Toggle USD/BS */}
      <div className="flex items-center gap-2">
        <Label htmlFor="usd-toggle" className="text-sm font-medium">
          {showInUSD ? "USD" : "BS"}
        </Label>
        <Switch id="usd-toggle" checked={showInUSD} onCheckedChange={setShowInUSD} />
      </div>

      {/* Dolar Rate Display */}
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-600" />
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : error ? (
          <Badge variant="destructive" className="text-xs">
            Error
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Oficial: Bs. {oficialRate?.toFixed(2)}
          </Badge>
        )}
      </div>

      {/* Refresh Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={loading}
        className="w-8 h-8"
      >
        <RefreshCw className="w-4 h-4" />
      </Button>
    </div>
  );
}
