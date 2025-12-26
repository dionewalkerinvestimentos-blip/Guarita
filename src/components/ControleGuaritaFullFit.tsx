/* ControleGuaritaFullFit.tsx
   - Preenche toda a tela visível (sem bordas pretas)
   - Ajusta proporcionalmente largura/altura
   - Mantém proporção e centralização
   - Não altera estrutura interna dos componentes
*/

import React, { useEffect, useState } from "react";

interface ControleGuaritaFullFitProps {
  children: React.ReactNode;
}

export default function ControleGuaritaFullFit({ children }: ControleGuaritaFullFitProps) {
  const [scale, setScale] = useState(1);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const baseW = 1920;
      const baseH = 1080;

      // Calcula escala ideal para caber na tela (sem sobras)
      const scaleW = screenW / baseW;
      const scaleH = screenH / baseH;
      const newScale = Math.min(scaleW, scaleH);

      // Centraliza verticalmente se sobrar espaço
      const usedH = baseH * newScale;
      const offset = (screenH - usedH) / 2;

      setScale(newScale);
      setOffsetY(offset > 0 ? offset : 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "linear-gradient(180deg, #0b0f17 0%, #0e1621 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          transition: "transform 0.3s ease",
          width: "1920px",
          height: "1080px",
          marginTop: `${offsetY}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}