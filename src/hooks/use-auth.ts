import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export const useAuth = () => {
  const { toast } = useToast();

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Por enquanto, autenticação simples para o usuário guarita
      // TODO: Implementar hash de senha quando a função SQL estiver criada
      if (username === 'guarita' && password === '123456') {
        // Armazenar dados do usuário no localStorage
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", "Guarita");
        localStorage.setItem("userId", "guarita-user-id");
        localStorage.setItem("userRole", "user");
        
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo, Guarita",
        });
        return true;
      }
      
      // Verificar se existem outros usuários na tabela
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, full_name, role, is_active')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro na consulta:', error);
        toast({
          title: "Erro no login",
          description: "Erro ao conectar com o servidor",
          variant: "destructive",
        });
        return false;
      }

      if (users) {
        // Por enquanto, aceita qualquer senha para usuários existentes no banco
        // TODO: Implementar verificação de hash quando a função estiver disponível
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", users.full_name || users.username);
        localStorage.setItem("userId", users.id);
        localStorage.setItem("userRole", users.role);
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${users.full_name || users.username}`,
        });
        return true;
      }

      toast({
        title: "Erro no login",
        description: "Usuário ou senha incorretos",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      toast({
        title: "Erro no login",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
  };

  const getCurrentUser = (): User | null => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) return null;

    return {
      id: localStorage.getItem("userId") || "",
      username: localStorage.getItem("username") || "",
      email: "",
      full_name: localStorage.getItem("username") || "",
      role: localStorage.getItem("userRole") || "user",
      is_active: true
    };
  };

  return {
    login,
    logout,
    getCurrentUser
  };
};