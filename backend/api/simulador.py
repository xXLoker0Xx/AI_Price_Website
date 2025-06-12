from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulacionInput(BaseModel):
    metodo: str
    proveedor: str = None  # solo para modo servidor
    modelo: str
    usoMensual: int
    conRAG: bool
    modo: str = None
    gpu: str = None
    energia_kwh_precio: float = None

@app.post("/simular")
def simular(data: SimulacionInput):
    coste = 0
    coste_inicial = 0
    recomendacion = None

    if data.metodo == "api":
        precios_api = {
            "gpt-3.5": 0.002,       # OpenAI
            "gpt-4": 0.06,          # OpenAI
            "cohere": 0.0015,       # Cohere Command R
            "llama3": 0.0008,       # Meta via Together/Fireworks
            "mistral": 0.0004,      # Mistral via OpenRouter/Fireworks
            "claude-3-opus": 0.012, # Anthropic (Claude 3 Opus)
            "claude-3-sonnet": 0.003,
            "gemini-pro": 0.0005,   # Google Gemini Pro
            "command-r+": 0.0010,   # Cohere Command R+
            "mixtral": 0.0006       # Mistral (Mixture of Experts)
        }
        precio_token = precios_api.get(data.modelo, 0.002)
        coste = (data.usoMensual / 1000) * precio_token
        coste_base = None
        if data.conRAG:
            coste += 20

#    | Proveedor | A100                    | V100                    | RTX4090                 | CPU                    |
#    | --------- | ----------------------- | ----------------------- | ----------------------- | ---------------------- |
#    | **AWS**   | 3.9 × 720 = **2,808 €** | 2.7 × 720 = **1,944 €** | 2.2 × 720 = **1,584 €** | 0.4 × 720 = **288 €**  |
#    | **Azure** | 4.2 × 720 = **3,024 €** | 2.9 × 720 = **2,088 €** | 2.1 × 720 = **1,512 €** | 0.5 × 720 = **360 €**  |
#    | **GCP**   | 3.8 × 720 = **2,736 €** | 2.6 × 720 = **1,872 €** | 1.9 × 720 = **1,368 €** | 0.45 × 720 = **324 €** |

    elif data.metodo == "servidor":
        if data.modo == "nube":
            precios_nube = {
                'aws': {'A100': 2808.0, 'V100': 1944.0, 'RTX4090': 1584.0, 'CPU': 288.0},
                'azure': {'A100': 3024.0, 'V100': 2088.0, 'RTX4090': 1512.0, 'CPU': 360.0},
                'gcp': {'A100': 2736.0, 'V100': 1872.0, 'RTX4090': 1368.0, 'CPU': 324.0}
            }

            capacidad_tokens_por_segundo = {
                "A100": 600,
                "V100": 250,
                "RTX4090": 400,
                "CPU": 100,
            }

            proveedor = getattr(data, "proveedor", "aws")
            gpu = data.gpu or "CPU"
            uso_tokens = data.usoMensual
            segundos_mes = 30 * 24 * 60 * 60
            tokens_por_segundo = uso_tokens / segundos_mes

            # Evaluar instancias necesarias con GPU seleccionada
            tps_gpu = capacidad_tokens_por_segundo[gpu]
            instancias_necesarias = math.ceil(tokens_por_segundo / tps_gpu)
            sobredimensionado = (
                instancias_necesarias == 1 and
                tokens_por_segundo < capacidad_tokens_por_segundo[gpu] * 0.4
            )

            # Cálculo del coste actual
            coste_base = precios_nube[proveedor].get(gpu)
            coste = coste_base * instancias_necesarias
            if data.conRAG:
                coste += 50


            # Buscar mejor alternativa
            alternativas = []
            for nombre, capacidad in capacidad_tokens_por_segundo.items():
                instancias = math.ceil(tokens_por_segundo / capacidad)
                precio_unitario = precios_nube[proveedor].get(nombre, 999)
                coste_total = precio_unitario * instancias
                alternativas.append({
                    "gpu": nombre,
                    "instancias": instancias,
                    "coste": coste_total,
                    "capacidad": capacidad,
                })

            alternativas_viables = [alt for alt in alternativas if alt["instancias"] <= 1]
            alternativas_viables.sort(key=lambda x: x["coste"])

            sugerencia = None
            if sobredimensionado and alternativas_viables:
                mejor_opcion = alternativas_viables[0]
                if mejor_opcion["gpu"] != gpu:
                    sugerencia = {
                        "mejor_gpu": mejor_opcion["gpu"],
                        "instancias": mejor_opcion["instancias"],
                        "capacidad": mejor_opcion["capacidad"],
                        "coste_estimado": mejor_opcion["coste"],
                        "razon": "La GPU seleccionada está sobredimensionada. Esta opción es más económica.",
                    }
            elif instancias_necesarias > 1:
                sugerencia = {
                    "instancias": instancias_necesarias,
                    "capacidad_actual": tps_gpu,
                    "razon": f"Se requieren {instancias_necesarias} instancias de {gpu} para cubrir la carga.",
                }

                # Buscar GPUs más potentes que reduzcan el número de instancias
                mejoras_posibles = []
                for otra_gpu, tps in capacidad_tokens_por_segundo.items():
                    if tps > tps_gpu:
                        nuevas_instancias = math.ceil(tokens_por_segundo / tps)
                        precio_unitario = precios_nube[proveedor].get(otra_gpu, 999)
                        coste_total = precio_unitario * nuevas_instancias
                        if nuevas_instancias < instancias_necesarias:
                            mejoras_posibles.append({
                                "gpu": otra_gpu,
                                "coste_unitario": precio_unitario,
                                "instancias": nuevas_instancias,
                                "capacidad": tps,
                                "coste_estimado": coste_total,
                                "razon": f"Con {otra_gpu} se necesitan solo {nuevas_instancias} instancias.",
                            })

                if mejoras_posibles:
                    mejor_opcion = sorted(mejoras_posibles, key=lambda x: x["coste_estimado"])[0]
                    sugerencia = mejor_opcion


            recomendacion = {
                "instancias_necesarias": instancias_necesarias,
                "capacidad_tokens_por_segundo": tps_gpu,
                "uso_estimado": "Suficiente" if instancias_necesarias <= 1 else "Requiere balanceo",
                "sobredimensionado": sobredimensionado,
                "sugerencia": sugerencia,
            }




        elif data.modo == "propio":
            costes_gpu = {"A100": 8000, "V100": 5000, "RTX4090": 3000, "CPU": 1500}
            consumo_watts = {"A100": 400, "V100": 250, "RTX4090": 300, "CPU": 120}
            tokens_por_segundo = {
                "A100": 600,
                "V100": 250,
                "RTX4090": 400,
                "CPU": 100
            }
            hardware_por_instancia = {
                "A100": {"cpu": "AMD EPYC 32 cores", "ram": "256GB DDR4"},
                "V100": {"cpu": "Intel Xeon 24 cores", "ram": "128GB DDR4"},
                "RTX4090": {"cpu": "Ryzen 7950X", "ram": "64GB DDR5"},
                "CPU": {"cpu": "Intel i9 13900K", "ram": "32GB DDR5"}
            }
            gpu = data.gpu or "CPU"
            base = costes_gpu.get(gpu, 1500)
            energia_precio = data.energia_kwh_precio or 0.25
            consumo_kwh_mes = (consumo_watts[gpu] * 24 * 30) / 1000

            # cálculo de instancias necesarias
            tps = tokens_por_segundo[gpu]
            tokens_requeridos_por_segundo = data.usoMensual / (30 * 24 * 60 * 60)
            instancias_necesarias = math.ceil(tokens_requeridos_por_segundo / tps)
            recomendacion = {
                "instancias_necesarias": instancias_necesarias,
                "capacidad_tokens_por_segundo": tps,
                "uso_estimado": "Suficiente" if instancias_necesarias <= 1 else "Requiere distribución de carga",
                "hardware": hardware_por_instancia[gpu]
            }

            
            coste_energia = consumo_kwh_mes * energia_precio
            coste_mensual = coste_energia + (80 if data.conRAG else 0)
            coste = coste_mensual * instancias_necesarias
            coste_base = coste_energia
            coste_inicial = base * instancias_necesarias
            if instancias_necesarias > 1:
                recomendacion["razon"] = f"Se requieren {instancias_necesarias} instancias de {gpu} para cubrir la carga."
            else:
                recomendacion["razon"] = "La GPU seleccionada es suficiente para la carga."

    resultado = {
        "coste_mensual": round(coste, 2),
    }

    if coste_inicial is not None:
        resultado["coste_inicial"] = round(coste_inicial, 2)
    if recomendacion is not None:
        resultado["recomendacion"] = recomendacion
    if coste_base is not None:
        resultado["coste_unitario"] = round(coste_base, 2)

    return resultado
