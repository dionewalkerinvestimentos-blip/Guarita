/* ControleGuaritaAutoFit.tsx
   Correção para layout de dashboard cortando parte inferior
   - Remove overflow e alturas fixas
   - Garante que o dashboard use a altura total visível da janela
   - Ajusta a escala de fonte de forma progressiva conforme altura da tela
   - NÃO altera estrutura dos componentes internos
*/

import React, { useEffect, useState } from "react";

interface ControleGuaritaAutoFitProps {
  children: React.ReactNode;
}

export default function ControleGuaritaAutoFit({ children }: ControleGuaritaAutoFitProps) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const ajustarZoom = () => {
      const altura = window.innerHeight;
      const baseAltura = 1080; // referência da sua tela ideal (TV cheia)
      const fator = altura / baseAltura;

      // Define zoom mínimo e máximo (evita distorção)
      const novoZoom = Math.min(Math.max(fator, 0.8), 1);
      setZoom(novoZoom);
    };

    ajustarZoom();
    window.addEventListener("resize", ajustarZoom);
    return () => window.removeEventListener("resize", ajustarZoom);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "linear-gradient(to bottom, #0d1117, #0e1621)",
        overflow: "auto",
        padding: "10px",
      }}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
          transition: "transform 0.3s ease-in-out",
          width: `${1920 / zoom}px`,
          maxWidth: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}