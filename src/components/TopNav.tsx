import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export const TopNav = () => {
  return (
    <header className="w-full border-b bg-background dark:bg-black sticky top-0 z-50">
      <div className="container mx-auto p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-xl font-bold">Guarita</Link>
          <nav className="hidden sm:flex items-center gap-2">
            <Link to="/loading" className="text-sm hover:underline">Carregamento</Link>
            <Link to="/materials" className="text-sm hover:underline">Materiais</Link>
            <Link to="/equipment" className="text-sm hover:underline">Equipamentos</Link>
            <Link to="/aeracao" className="text-sm hover:underline">Aeração</Link>
          </nav>
        </div>
        <div>
          <Button variant="ghost" size="sm">Usuário</Button>
        </div>
      </div>
    </header>
  )
}
