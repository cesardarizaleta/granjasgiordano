import { useDolar } from "@/hooks/useDolar";

export function usePriceFormatter() {
  const { convertToUSD, oficialRate, showInUSD } = useDolar();

  const formatPrice = (amount: number, currency: "VES" | "USD" = "VES"): string => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)} USD`;
    }
    if (showInUSD) {
      const usdAmount = convertToUSD(amount);
      return `$${usdAmount.toFixed(2)} USD`;
    }
    return `Bs. ${amount.toFixed(2)}`;
  };

  const formatPriceDual = (amountUSD: number, amountBS: number): string => {
    if (
      typeof amountUSD !== "number" ||
      isNaN(amountUSD) ||
      typeof amountBS !== "number" ||
      isNaN(amountBS)
    ) {
      return "Precio no disponible";
    }
    if (showInUSD) {
      return `$${amountUSD.toFixed(2)} USD / Bs. ${amountBS.toFixed(2)}`;
    }
    return `Bs. ${amountBS.toFixed(2)} / $${amountUSD.toFixed(2)} USD`;
  };

  const getCurrentRate = (): number | null => {
    return oficialRate;
  };

  return {
    formatPrice,
    formatPriceDual,
    getCurrentRate,
    convertToUSD,
    showInUSD,
  };
}
