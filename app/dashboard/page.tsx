"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [cotizaciones, setCotizaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cargarDatos = async () => {
      // 1. Verificamos la llave de seguridad
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // 2. Traemos los datos de la base de datos, ordenados por fecha (más recientes primero)
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      if (error) {
        console.error("Error cargando cotizaciones:", error);
      } else {
        setCotizaciones(data || []);
      }
      setCargando(false);
    };

    cargarDatos();
  }, [router]);

  // Formato para mostrar el dinero bonito en la tabla
  const formatearDinero = (monto: number) => {
    return monto.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Formato para que la fecha sea legible
  const formatearFecha = (fechaISO: string) => {
    return new Date(fechaISO).toLocaleDateString("es-BO");
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl font-bold text-slate-500 animate-pulse">Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera del Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Panel de Control NODO</h1>
            <p className="text-slate-500 mt-1">Historial general de cotizaciones de Torre Bambú</p>
          </div>
          <button 
            onClick={() => router.push("/")}
            className="bg-slate-800 text-white px-6 py-3 rounded-xl hover:bg-slate-700 transition-colors shadow-sm font-semibold"
          >
            Volver al Cotizador
          </button>
        </div>

        {/* Tabla de Datos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-semibold">Fecha</th>
                  <th className="p-4 font-semibold">Asesor</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Teléfono</th>
                  <th className="p-4 font-semibold">Tipología</th>
                  <th className="p-4 font-semibold">Precio Total</th>
                  <th className="p-4 font-semibold">A Financiar</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {cotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Aún no hay cotizaciones registradas en la plataforma.
                    </td>
                  </tr>
                ) : (
                  cotizaciones.map((cot, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-500">{formatearFecha(cot.fecha_creacion)}</td>
                      <td className="p-4 font-medium text-slate-600">{cot.asesor_email || "No registrado"}</td>
                      <td className="p-4 font-medium text-slate-800">{cot.cliente_nombre}</td>
                      <td className="p-4 text-slate-600">{cot.telefono || "-"}</td>
                      <td className="p-4 text-slate-600">{cot.tipologia}</td>
                      <td className="p-4 font-semibold text-emerald-600">${formatearDinero(cot.precio_total)}</td>
                      <td className="p-4 text-slate-600">${formatearDinero(cot.monto_financiar)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}