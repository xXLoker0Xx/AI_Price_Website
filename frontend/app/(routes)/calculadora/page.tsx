"use client";

import { useEffect, useState } from "react";

export default function Simulador() {
  const [metodo, setMetodo] = useState("api");
  const [modelo, setModelo] = useState("gpt-3.5");
  const [usoMensual, setUsoMensual] = useState(100000);
  const [conRAG, setConRAG] = useState(false);
  const [modo, setModo] = useState("nube");
  const [proveedor, setProveedor] = useState("aws");
  const [gpu, setGpu] = useState("A100");
  const [energiaPrecio, setEnergiaPrecio] = useState(0.25);
  const [costeResultado, setCosteResultado] = useState<ResultadoCoste | null>(null);

  type ResultadoCoste = {
    coste_unitario?: number;
    coste_mensual?: number;
    coste_inicial?: number;
    recomendacion?: {
      instancias_necesarias: number;
      capacidad_tokens_por_segundo: number;
      uso_estimado: string;
      hardware?: {
        cpu: string;
        ram: string;
      };
      sugerencia?: {
        razon: string;
        mejor_gpu?: string;
        coste_unitario?: number;
        coste_estimado?: number;
        instancias?: number;
        capacidad?: number;
      };
    };
  };

  useEffect(() => {
    setCosteResultado(null);
  }, [metodo, modelo, usoMensual, conRAG, gpu, energiaPrecio, modo, proveedor]);

  const enviarSimulacion = async () => {
    const payload: {
      metodo: string;
      modelo: string;
      usoMensual: number;
      conRAG: boolean;
      modo?: string;
      gpu?: string;
      energia_kwh_precio?: number;
      proveedor?: string;
    } = {
      metodo,
      modelo,
      usoMensual,
      conRAG,
      ...(metodo === "servidor" && {
        modo,
        gpu,
        energia_kwh_precio: energiaPrecio,
        proveedor,
      }),
    };

    try {
      const response = await fetch("http://localhost:8000/simular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setCosteResultado(data);
    } catch (error) {
      console.error("Error al conectar con el backend", error);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full space-y-4">
        <h2 className="text-2xl font-semibold text-center">Calculadora de Costes IA</h2>

        <div>
          <label>Método:</label>
          <select
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
            className="w-full border rounded px-4 py-2"
          >
            <option value="api">API</option>
            <option value="servidor">Servidor propio</option>
          </select>
        </div>

        {metodo === "api" && (
          <>
            <div>
              <label>Modelo:</label>
              <select
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full border rounded px-4 py-2"
              >
                <option value="gpt-3.5">GPT-3.5 (OpenAI)</option>
                <option value="gpt-4">GPT-4 (OpenAI)</option>
                <option value="cohere">Cohere</option>
                <option value="llama3">LLaMA 3 (Meta)</option>
                <option value="mistral">Mistral</option>
                <option value="claude-3-opus">Claude 3 Opus (Anthropic)</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet (Anthropic)</option>
                <option value="gemini-pro">Gemini Pro (Google)</option>
                <option value="command-r+">Command R+ (Cohere)</option>
                <option value="mixtral">Mixtral (Mistral)</option>
              </select>
            </div>

            <div>
              <label>Tokens mensuales (aproximado):</label>
              <input
                type="text"
                inputMode="numeric"
                value={usoMensual.toLocaleString("es-ES")}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                  setUsoMensual(Number(raw));
                }}
                className="w-full border rounded px-4 py-2"
              />
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={conRAG}
                  onChange={(e) => setConRAG(e.target.checked)}
                />
                ¿Usar RAG (base de datos vectorial)?
              </label>
            </div>
          </>
        )}

        {metodo === "servidor" && (
          <>
            <div>
              <label>Modo de servidor:</label>
              <select
                value={modo}
                onChange={(e) => setModo(e.target.value)}
                className="w-full border rounded px-4 py-2"
              >
                <option value="nube">Alquiler en la nube</option>
                <option value="propio">Infraestructura propia</option>
              </select>
            </div>

            {modo === "nube" && (
              <>
                <div>
                  <label>Proveedor de nube:</label>
                  <select
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className="w-full border rounded px-4 py-2 mb-4"
                  >
                    <option value="aws">AWS</option>
                    <option value="azure">Azure</option>
                    <option value="gcp">Google Cloud</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label>GPU utilizada:</label>
              <select
                value={gpu}
                onChange={(e) => setGpu(e.target.value)}
                className="w-full border rounded px-4 py-2"
              >
                <option value="A100">A100</option>
                <option value="V100">V100</option>
                <option value="RTX4090">RTX 4090</option>
                <option value="CPU">Solo CPU</option>
              </select>
            </div>

            <div>
              <label>Tokens mensuales (aproximado):</label>
              <input
                type="text"
                inputMode="numeric"
                value={usoMensual.toLocaleString("es-ES")}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                  setUsoMensual(Number(raw));
                }}
                className="w-full border rounded px-4 py-2"
              />
            </div>

            {modo === "propio" && (
              <>
                <div>
                  <label>Precio energía (€/kWh):</label>
                  <input
                    type="number"
                    value={energiaPrecio}
                    onChange={(e) => setEnergiaPrecio(Number(e.target.value))}
                    className="w-full border rounded px-4 py-2"
                  />
                </div>

              </>
            )}

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={conRAG}
                  onChange={(e) => setConRAG(e.target.checked)}
                />
                ¿Usar RAG (base de datos vectorial)?
              </label>
            </div>

          </>
        )}

        <button
          onClick={enviarSimulacion}
          className="w-full bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition"
        >
          Calcular coste
        </button>

        {costeResultado && (
          <div className="text-center text-lg mt-6 space-y-2">
            <p>
              💰 <strong>Coste mensual:</strong>{" "}
              {costeResultado.coste_mensual?.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} €/mes
            </p>
            
            {costeResultado.coste_inicial != null && (
              <p>
                🧱 <strong>Coste inicial:</strong>{" "}
                {costeResultado.coste_inicial.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} €
              </p>
            )}

            {costeResultado.recomendacion && (
              <div className="mt-4 text-sm text-gray-700">
                <p>🔢 <strong>Instancias necesarias:</strong> {costeResultado.recomendacion.instancias_necesarias}</p>
                <p>⚙️ <strong>Capacidad de tokens/s por instancia:</strong> {costeResultado.recomendacion.capacidad_tokens_por_segundo}</p>
                <p>📈 <strong>Precio instancia:</strong> {costeResultado.coste_unitario}</p>
                <p>📈 <strong>Uso estimado:</strong> {costeResultado.recomendacion.uso_estimado}</p>

                {costeResultado.recomendacion.sugerencia && (
                  <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-800">💡 Sugerencia:</p>
                    <p className="text-blue-700 mt-1">{costeResultado.recomendacion.sugerencia.razon}</p>

                    {costeResultado.recomendacion.sugerencia.mejor_gpu && (
                      <p className="mt-2">🧠 GPU sugerida: <strong>{costeResultado.recomendacion.sugerencia.mejor_gpu}</strong></p>
                    )}

                    {costeResultado.recomendacion.sugerencia.coste_unitario && (
                      <p className="mt-2">🧠 Coste Unitario: <strong>{costeResultado.recomendacion.sugerencia.coste_unitario}</strong> €/mes</p>
                    )}

                    {costeResultado.recomendacion.sugerencia.instancias && (
                      <p className="mt-2">🔁 Instancias sugeridas: <strong>{costeResultado.recomendacion.sugerencia.instancias}</strong></p>
                    )}

                    {costeResultado.recomendacion.sugerencia.capacidad && (
                      <p className="mt-2">⚙️ Capacidad tokens/s: <strong>{costeResultado.recomendacion.sugerencia.capacidad}</strong></p>
                    )}

                    {costeResultado.recomendacion.sugerencia.coste_estimado !== undefined && (
                      <p className="mt-2">💸 Coste estimado: <strong>{costeResultado.recomendacion.sugerencia.coste_estimado.toFixed(2)} €</strong></p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
