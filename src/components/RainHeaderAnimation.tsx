import { useEffect, useState } from 'react'

interface Raindrop {
  id: number
  left: number
  animationDuration: number
  opacity: number
  size: number
  delay: number
}

export const RainHeaderAnimation = () => {
  const [raindrops, setRaindrops] = useState<Raindrop[]>([])

  useEffect(() => {
    console.log('🌧️ RainHeaderAnimation montado!')
    // Criar gotas de chuva para o header (aumentado para 50 gotas)
    const drops: Raindrop[] = []
    for (let i = 0; i < 50; i++) {
      drops.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 0.6 + Math.random() * 1.0,
        opacity: 0.5 + Math.random() * 0.5,
        size: 1.2 + Math.random() * 1.8,
        delay: Math.random() * 2
      })
    }
    setRaindrops(drops)
  }, [])

  return (
    <>
      {/* Mensagem "Chovendo..." - VISÍVEL EM FUNDO ESCURO */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="flex items-center gap-2 bg-cyan-500/40 backdrop-blur-md px-4 py-2 rounded-full border-2 border-cyan-300/60 animate-pulse shadow-lg shadow-cyan-500/50">
          <svg 
            className="w-6 h-6 text-cyan-100 animate-bounce drop-shadow-lg" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-bold text-base tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            🌧️ CHOVENDO...
          </span>
        </div>
      </div>

      {/* Animação de gotas de chuva - BRANCAS E BRILHANTES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {raindrops.map((drop) => (
          <div
            key={drop.id}
            className="absolute w-1 bg-white rounded-full"
            style={{
              left: `${drop.left}%`,
              height: `${drop.size * 20}px`,
              opacity: drop.opacity * 0.9,
              animation: `rain-fall-header ${drop.animationDuration}s linear infinite`,
              animationDelay: `${drop.delay}s`,
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 4px rgba(96, 165, 250, 0.6)',
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(147, 197, 253, 0.6))'
            }}
          />
        ))}
        
        <style>{`
          @keyframes rain-fall-header {
            0% {
              transform: translateY(-100%);
            }
            100% {
              transform: translateY(calc(100vh + 100%));
            }
          }
        `}</style>
      </div>
    </>
  )
}
