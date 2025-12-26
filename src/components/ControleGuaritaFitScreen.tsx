/* ControleGuaritaFitScreen.tsx
   📺 Ajusta automaticamente todos os elementos do dashboard
   🧩 Sem cortes, sem faixas pretas, sem escala forçada
   ⚙️ Mantém a proporção dos cards e ajusta fontes com clamp()
*/

import React from "react";

interface ControleGuaritaFitScreenProps {
  children: React.ReactNode;
}

export default function ControleGuaritaFitScreen({ children }: ControleGuaritaFitScreenProps) {
  return (
    <div
      className="
        w-full 
        min-h-screen 
        bg-gradient-to-b from-[#0b0f17] to-[#0e1621]
        flex flex-col
        justify-start
        items-stretch
        overflow-hidden
        px-[clamp(0.5rem,2vw,2rem)]
        py-[clamp(0.5rem,2vh,1rem)]
        text-[clamp(0.75rem,1vw,1.1rem)]
      "
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {children}
    </div>
  );
}