/* ControleGuaritaResponsiveWrapper.tsx
   ✅ Corrige o corte dos cards inferiores
   ✅ Evita rolagem vertical
   ✅ Faz o dashboard se auto-ajustar com suavidade (transição CSS)
   ✅ Mantém toda a estrutura atual
   ✅ Ajusta fontes e ícones proporcionalmente
*/

import React, { useEffect, useState } from "react";

interface ControleGuaritaResponsiveWrapperProps {
  children: React.ReactNode;
}

export default function ControleGuaritaResponsiveWrapper({ 
  children 
}: ControleGuaritaResponsiveWrapperProps) {
  const [scale, setScale] = useState(1);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Tamanho base de design do seu painel
      const baseWidth = 1920;
      const baseHeight = 1080;

      // Escala proporcional (menor fator entre largura e altura)
      const factor = Math.min(width / baseWidth, height / baseHeight);

      // Definir escala mínima e máxima (evita distorções)
      const safeScale = Math.min(Math.max(factor, 0.6), 1.4);

      setScale(safeScale);
      setFontScale(0.9 + safeScale * 0.6); // fontes mais suaves
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "linear-gradient(to bottom right, #0b0f17, #101820)",
      }}
    >
      <div
        style={{
          transformOrigin: "top center",
          width: `1920px`,
          height: `1080px`,
          transform: `scale(${scale})`,
          fontSize: `${16 * fontScale}px`,
          color: "#00ffb3",
          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), font-size 0.4s ease",
        }}
        className="flex flex-col gap-2 px-6 py-3"
      >
        {children}
      </div>
    </div>
  );
}