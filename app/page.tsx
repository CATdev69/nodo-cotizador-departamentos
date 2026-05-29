
"use client";
import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  // --- 1. PRIMERO: TODOS LOS HOOKS DE REACT ---
  const router = useRouter();
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false); // <-- NUEVO: Guarda si el usuario es admin

  // Memoria de la Calculadora
  const [precioDepto, setPrecioDepto] = useState(0);
  const [precioParqueo, setPrecioParqueo] = useState(0);
  const [cuotaInicial, setCuotaInicial] = useState(0);
  const [porcentajeFinanciar, setPorcentajeFinanciar] = useState(0);
  const [tipoCambio, setTipoCambio] = useState(6.96);
  const [mostrarEnBs, setMostrarEnBs] = useState(false);
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [correoCliente, setCorreoCliente] = useState("");
  const [pisoDepartamento, setPisoDepartamento] = useState("");
  const [metrosCuadrados, setMetrosCuadrados] = useState(0);
  const [numDormitorios, setNumDormitorios] = useState(0);
  const [orientacion, setOrientacion] = useState(""); 
  const [tipologia, setTipologia] = useState("");

  // --- VERIFICACIÓN DE SEGURIDAD Y ROLES ---
  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
      } else {
        // REGLA DE ACCESO: Pon aquí tu correo exacto de administrador
        if (session.user.email === "adm@nodo.com") {
          setEsAdmin(true);
        }
        setCargandoAuth(false);
      }
    };
    verificarSesion();
  }, [router]);

  // --- 3. TERCERO: FUNCIÓN DE CERRAR SESIÓN ---
  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // --- 4. CUARTO: PANTALLA DE CARGA ---
  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-xl font-bold text-slate-500 animate-pulse">Verificando acceso a NODO...</p>
      </div>
    );
  }



  // --- 2. LÓGICA FINANCIERA CORREGIDA ---
  const precioTotalBase = precioDepto + precioParqueo;
  
  // Condicionales de descuento
  let porcentajeDescuento = 0;
  if (cuotaInicial === 50) porcentajeDescuento = 0.028; // 2.8% de descuento
  if (cuotaInicial === 100) porcentajeDescuento = 0.065; // 6.5% de descuento

  const montoDescuento = precioTotalBase * porcentajeDescuento;
  const precioFinal = precioTotalBase - montoDescuento; // Total al final con descuento
  
  // Calculamos el dinero a financiar basados en el % que escribe el asesor
  const montoFinanciar = precioFinal * (porcentajeFinanciar / 100);
  
  // Si pagan al contado (100%), no hay cuotas. Sino, se divide en 26
  const cuotaMensual = cuotaInicial === 100 ? 0 : montoFinanciar / 26;

  // Lógica de conversión Dólar / Boliviano
  const multiplicador = mostrarEnBs ? tipoCambio : 1;
  const simboloMoneda = mostrarEnBs ? "Bs" : "$";

  const formatearDinero = (monto: number) => {
    return (monto * multiplicador).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
      // Función para enviar por WhatsApp
      const enviarWhatsApp = () => {
        if (!nombreCliente || !telefonoCliente) {
          alert("Por favor, ingresa el nombre y teléfono del cliente primero.");
          return;
        }

        const mensaje = `🏢 *COTIZACIÓN TORRE BAMBÚ* 🏢
    Hola *${nombreCliente}*, te comparto el resumen de tu cotización:

    *Detalles del Inmueble:*
    - Tipología: ${tipologia}
    - Piso: ${pisoDepartamento}
    - Metros Cuadrados: ${metrosCuadrados} m²
    - Dormitorios: ${numDormitorios}
    - Orientación: ${orientacion}
    - Precio Base: ${simboloMoneda} ${formatearDinero(precioTotalBase)}
    - Descuento Aplicado: - ${simboloMoneda} ${formatearDinero(montoDescuento)}
    - *Total Final:* ${simboloMoneda} ${formatearDinero(precioFinal)}

    *Plan de Financiamiento:*
    - Cuota Inicial: ${cuotaInicial}%
    - Monto a Financiar (${porcentajeFinanciar}%): ${simboloMoneda} ${formatearDinero(montoFinanciar)}
    - *Plan 26 Cuotas Mensuales:* ${simboloMoneda} ${formatearDinero(cuotaMensual)}

    ¡Quedo a tu disposición para cualquier consulta!`;

        // Codificamos el texto para que las URLs lo entiendan (espacios, saltos de línea)
        const mensajeCodificado = encodeURIComponent(mensaje);
        
        // Abrimos la API de WhatsApp
        window.open(`https://wa.me/${telefonoCliente}?text=${mensajeCodificado}`, '_blank');
      };
  // --- 3. GENERACIÓN DE PDF Y GUARDADO EN BASE DE DATOS ---
  const guardarPDF = async () => {
    if (!nombreCliente) {
      alert("Por favor, ingresa el nombre del cliente para generar el archivo.");
      return;
    }

    // --- GUARDAR EN BASE DE DATOS SUPABASE (Requisito #9) ---
    // --- GUARDAR EN BASE DE DATOS SUPABASE (Requisito #9) ---
    try {
      // Capturamos los datos del usuario autenticado actualmente
      const { data: { user } } = await supabase.auth.getUser();
      const correoAsesor = user?.email || "Desconocido";

      const { error } = await supabase
        .from('cotizaciones')
        .insert([
          {
            cliente_nombre: nombreCliente,
            telefono: telefonoCliente,
            tipologia: tipologia || 'No especificada',
            precio_total: precioFinal,
            monto_financiar: montoFinanciar,
            asesor_email: correoAsesor // <-- Guardamos el correo del asesor
          }
        ]);

      if (error) {
        console.error("Error al guardar en la BD:", error);
        alert("El PDF se generará, pero hubo un problema guardando en la nube.");
      }
    } catch (err) {
      console.error("Error de conexión:", err);
    }

    // --- GENERACIÓN DEL ARCHIVO PDF ---
    const doc = new jsPDF();
    const fechaActual = new Date().toLocaleDateString();
    const numCotizacion = Math.floor(100000 + Math.random() * 900000);

    // Encabezado Corporativo
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TORRE BAMBÚ", 15, 25);

    // Diseño del Logo Vectorial
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.7);
    doc.line(175, 12, 175, 28);
    doc.line(180, 8, 180, 28);
    doc.line(185, 14, 185, 28);
    doc.line(190, 10, 190, 28);

    // Fecha y Cotización
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.text(`Fecha: ${fechaActual}`, 125, 20);
    doc.text(`Cotización N°: ${numCotizacion}`, 125, 26);

    // --- SECCIÓN 1: DATOS DEL CLIENTE ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("1. Información del Cliente", 15, 53);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 56, 195, 56);

    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Cliente: ${nombreCliente}`, 15, 63);
    doc.text(`Teléfono: ${telefonoCliente || "No especificado"}`, 15, 69);
    doc.text(`Correo electrónico: ${correoCliente || "No especificado"}`, 15, 75);

    // --- SECCIÓN 2: DATOS DEL INMUEBLE ---
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("2. Especificaciones de la Propiedad", 15, 90);
    doc.line(15, 93, 195, 93);

    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Precio Base Departamento: $ ${precioDepto.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 15, 101);
    doc.text(`Precio Base Parqueo: $ ${precioParqueo.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 15, 108);
    
    doc.text(`Tipología: ${tipologia || "No especificada"}`, 15, 115);
    doc.text(`Piso: ${pisoDepartamento || "No especificado"}`, 15, 122);
    doc.text(`Metros Cuadrados: ${Number(metrosCuadrados) > 0 ? metrosCuadrados + " m²" : "No especificado"}`, 15, 129);
    doc.text(`Dormitorios: ${Number(numDormitorios) > 0 ? numDormitorios : "No especificado"}`, 15, 136);
    doc.text(`Orientación: ${orientacion || "No especificada"}`, 15, 143);

    // --- SECCIÓN 3: RESUMEN FINANCIERO ---
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("3. Plan de Pagos y Resumen Financiero", 15, 155);
    doc.line(15, 158, 195, 158);

    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Subtotal Inmuebles: ${simboloMoneda} ${formatearDinero(precioTotalBase)}`, 15, 166);
    doc.text(`Descuento Aplicado: - ${simboloMoneda} ${formatearDinero(montoDescuento)}`, 15, 172);
    
    doc.setFont("Helvetica", "bold");
    doc.text(`PRECIO TOTAL FINAL: ${simboloMoneda} ${formatearDinero(precioFinal)}`, 15, 181);
    
    doc.setFont("Helvetica", "normal");
    doc.text(`Aporte Cuota Inicial (${cuotaInicial}%): ${simboloMoneda} ${formatearDinero(precioFinal * (cuotaInicial / 100))}`, 15, 189);
    doc.text(`Saldo Comercial a Financiar (${porcentajeFinanciar}%): ${simboloMoneda} ${formatearDinero(montoFinanciar)}`, 15, 196);

    // Bloque Destacado de Cuotas
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 205, 180, 16, "F");
    
    doc.setTextColor(15, 118, 110);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`PLAN DE 26 CUOTAS MENSUALES: ${simboloMoneda} ${formatearDinero(cuotaMensual)}`, 22, 215);

    // Pie de Página
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Este documento constituye una simulación financiera preliminar informativa vinculada a Torre Bambú.", 15, 265);
    doc.text("Los valores comerciales y disponibilidad de inventario están sujetos a variaciones institucionales.", 15, 270);

    const nombreLimpio = nombreCliente.trim().replace(/\s+/g, "_");
    doc.save(`Cotizacion_Torre_Bambu_${nombreLimpio}.pdf`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-4xl bg-white/40 backdrop-blur-lg border border-white/60 shadow-2xl rounded-3xl p-8 transition-all">

       <div className="text-center mb-8 relative">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Cotizador NODO</h1>
          <p className="text-slate-500 mt-2 font-medium">Panel de Asesores</p>
          
          {/* Botones de Control de la Plataforma */}
          <div className="absolute top-0 right-0 flex gap-2">
            {/* Este botón SOLO aparecerá si iniciaste sesión con el correo admin */}
            {esAdmin && (
              <button 
                onClick={() => router.push("/dashboard")}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors bg-white/80 hover:bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
              >
                 Ver Dashboard
              </button>
            )}

            <button 
              onClick={cerrarSesion}
              className="text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors bg-white/60 px-4 py-2 rounded-xl border border-transparent hover:border-red-200 shadow-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
        {/* Sección 1: Datos del Cliente */}
        <div className="bg-white/50 rounded-2xl p-6 shadow-sm mb-6 border border-white/50">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">1. Datos del Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
            <input 
              type="text" 
              placeholder="Nombre Completo" 
              onChange={(e) => setNombreCliente(e.target.value)} // <-- NUEVO
              className="w-full px-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300" 
            />
            <input 
              type="tel" 
              placeholder="Número de Teléfono" 
              onChange={(e) => setTelefonoCliente(e.target.value)} // <-- NUEVO
              className="w-full px-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300" 
            />
             <input 
              type="email" 
              placeholder="Correo Electrónico (Opcional)" 
              onChange={(e) => setCorreoCliente(e.target.value)} // <-- NUEVO
              className="w-full px-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300" 
            />
          </div>
        </div>

        {/* Sección 2: Datos del Inmueble */}
        <div className="bg-white/50 rounded-2xl p-6 shadow-sm mb-6 border border-white/50">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">2. Datos del Inmueble</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-bold">$</span>
              <input type="number" placeholder="Precio del Departamento" onChange={(e) => setPrecioDepto(Number(e.target.value))} className="w-full pl-8 pr-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300" />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-bold">$</span>
              <input type="number" placeholder="Precio del Parqueo (Opcional)" onChange={(e) => setPrecioParqueo(Number(e.target.value))} className="w-full pl-8 pr-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
              <input type="text" placeholder="Tipología" onChange={(e) => setTipologia(e.target.value)} className="w-full px-4 pr-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300" />
              <input type="number" placeholder="Piso del Departamento" onChange={(e) => setPisoDepartamento(e.target.value)} className="w-full px-4 pr-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300" />

            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="number" placeholder="Metros Cuadrados (m²)"onChange={(e) => setMetrosCuadrados(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300" />
            <input type="number" placeholder="Nº de Dormitorios" onChange={(e) => setNumDormitorios(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300" />
            <select defaultValue="" onChange={(e) => setOrientacion(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300">
              <option value="" disabled>Orientación</option>
              <option value="norte">Norte</option>
              <option value="sur">Sur</option>
              <option value="este">Este</option>
              <option value="oeste">Oeste</option>
            </select>
          </div>
        </div>

        {/* Sección 3: Plan de Pagos y Resultados Actualizado */}
        <div className="bg-white/50 rounded-2xl p-6 shadow-sm mb-6 border border-white/50">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">3. Plan de Pagos</h2>
          
          {/* Cambiado a 3 columnas para incluir el Porcentaje a Financiar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-bold">%</span>
              <input 
                type="number" 
                placeholder="Cuota Inicial"
                onChange={(e) => setCuotaInicial(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300"
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-bold">%</span>
              <input 
                type="number" 
                placeholder="A Financiar"
                onChange={(e) => setPorcentajeFinanciar(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300"
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-bold">Bs</span>
              <input 
                type="number" 
                defaultValue={6.96}
                onChange={(e) => setTipoCambio(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-transparent bg-white/70 shadow-inner text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all duration-300"
              />
            </div>
          </div>

          {/* Panel de Resultados Financieros Detallado */}
          <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            
            <h3 className="text-xl font-bold mb-4 border-b border-white/20 pb-2">Resumen de Cotización</h3>
            
            <div className="space-y-3 mb-6 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Precio Base (Depto + Parqueo):</span>
                <span className="font-medium text-slate-300">{simboloMoneda} {formatearDinero(precioTotalBase)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Descuento {porcentajeDescuento > 0 ? `(${(porcentajeDescuento * 100).toFixed(1)}%)` : ""}:</span>
                <span className="font-medium text-emerald-400">- {simboloMoneda} {formatearDinero(montoDescuento)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-slate-200">Total Final:</span>
                <span className="font-semibold text-lg">{simboloMoneda} {formatearDinero(precioFinal)}</span>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-200">Monto a Financiar ({porcentajeFinanciar}%):</span>
                <span className="font-semibold text-lg">{simboloMoneda} {formatearDinero(montoFinanciar)}</span>
              </div>

              <div className="flex justify-between items-center bg-white/10 p-3 rounded-lg border border-white/10 mt-2">
                <span className="text-white font-medium">Plan 26 Cuotas Mensuales:</span>
                <span className="font-bold text-xl text-emerald-400">{simboloMoneda} {formatearDinero(cuotaMensual)}</span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
              <button 
                onClick={() => setMostrarEnBs(!mostrarEnBs)} 
                className="flex-1 bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors shadow-md"
              >
                {mostrarEnBs ? "Ver en Dólares ($)" : "Convertir a Bs"}
              </button>
             <button 
                onClick={enviarWhatsApp} // <-- NUEVO
                className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-md"
              >
                Enviar por WhatsApp
              </button>
              <button 
                onClick={guardarPDF} // <-- NUEVO
                className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-md"
              >
                Guardar en PDF
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}