"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMensajeError("Correo o contraseña incorrectos. Intenta de nuevo.");
      setCargando(false);
    } else {
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen flex font-sans">
      
      {/* Lado izquierdo: Formulario de Acceso */}
      <div className="w-full lg:w-1/2 bg-slate-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 transition-all hover:shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">NODO</h1>
            <p className="text-slate-500 mt-2 font-medium">Acceso a Panel de Asesores</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Correo Electrónico</label>
              <input 
                type="email" 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-800"
                placeholder="asesor@nodo.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
              <input 
                type="password" 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-800"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Mensaje de error visual */}
            {mensajeError && (
              <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg font-medium text-center">
                {mensajeError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={cargando}
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors shadow-md mt-4 disabled:bg-slate-400"
            >
              {cargando ? "Verificando..." : "Iniciar Sesión"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>

      {/* Lado derecho: Imagen de Portada */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1000&auto=format&fit=crop" 
          alt="Portada Torre Bambú" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12 text-center">
          <h2 className="text-4xl font-bold mb-4 drop-shadow-lg tracking-wide">Gestión Inmobiliaria Premium</h2>
          <p className="text-lg text-slate-200 drop-shadow-md font-medium">Plataforma exclusiva para el proyecto Torre Bambú.</p>
        </div>
      </div>
      
    </main>
  );
}