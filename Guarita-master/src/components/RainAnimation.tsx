import { useEffect, useState } from 'react'

interface Raindrop {
  id: number
  left: number
  animationDuration: number
  opacity: number
  size: number
}

export const RainAnimation = () => {
  const [raindrops, setRaindrops] = useState<Raindrop[]>([])

  useEffect(() => {
    // Criar gotas de chuva
    const drops: Raindrop[] = []
    for (let i = 0; i < 50; i++) {
      drops.push({
        id: i,
        left: Math.random() * 100, // posição horizontal (%)
        animationDuration: 0.5 + Math.random() * 1, // duração da animação (segundos)
        opacity: 0.3 + Math.random() * 0.4, // opacidade
        size: 1 + Math.random() * 2 // tamanho
      })
    }
    setRaindrops(drops)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {raindrops.map((drop) => (
        <div
          key={drop.id}
          className="absolute w-0.5 bg-blue-400/60 rounded-full animate-rain"
          style={{
            left: `${drop.left}%`,
            height: `${drop.size * 20}px`,
            opacity: drop.opacity,
            animation: `rain-fall ${drop.animationDuration}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
      
      {/* CSS para a animação */}
      <style>{`
        @keyframes rain-fall {
          0% {
            transform: translateY(-10vh);
          }
          100% {
            transform: translateY(110vh);
          }
        }
        
        .animate-rain {
          will-change: transform;
        }
      `}</style>
    </div>
  )
}
