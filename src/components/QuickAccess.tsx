import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NuevaVentaModal } from "./NuevaVentaModal";
import { NuevoClienteModal } from "./NuevoClienteModal";

export function QuickAccess() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openVentaModal = () => {
    setIsVentaModalOpen(true);
    setIsMenuOpen(false);
  };

  const openClienteModal = () => {
    setIsClienteModalOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Blur Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 lg:left-64 backdrop-blur-sm bg-black/10 z-40 animate-in fade-in duration-300" />
      )}

      {/* FAB Button */}
      <div className="fixed bottom-8 right-8 z-50">
        {/* Menu */}
        {isMenuOpen && (
          <div className="absolute bottom-20 right-1/2 translate-x-1/2 mb-4 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-300">
            <Button
              size="icon"
              className="w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-110"
              onClick={openVentaModal}
              title="Nueva Venta"
            >
              <span className="material-symbols-rounded" style={{ fontSize: "28px" }}>
                shopping_cart
              </span>
            </Button>
            <Button
              size="icon"
              className="w-14 h-14 rounded-full shadow-lg bg-secondary hover:bg-secondary/90 transition-all duration-200 hover:scale-110"
              onClick={openClienteModal}
              title="Nuevo Cliente"
            >
              <span className="material-symbols-rounded" style={{ fontSize: "28px" }}>
                person_add
              </span>
            </Button>
          </div>
        )}

        {/* FAB */}
        <Button
          size="icon"
          className="w-20 h-20 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          onClick={toggleMenu}
        >
          <span
            className={`material-symbols-rounded transition-transform duration-300 ${!isMenuOpen ? "rotate-45" : ""}`}
            style={{ fontSize: "36px" }}
          >
            close
          </span>
        </Button>
      </div>

      {/* Modals */}
      <NuevaVentaModal open={isVentaModalOpen} onOpenChange={setIsVentaModalOpen} />
      <NuevoClienteModal open={isClienteModalOpen} onOpenChange={setIsClienteModalOpen} />
    </>
  );
}
