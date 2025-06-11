# backend/main.py
from fastapi import FastAPI, Request
from pydantic import BaseModel

app = FastAPI()

class ProjectInput(BaseModel):
    tipo: str
    entrenamiento_propio: bool
    equipo: str
    infraestructura: str
    datos: str
    duracion_meses: int

@app.post("/calcular-coste")
async def calcular_coste(input: ProjectInput):
    # Reglas básicas de estimación (puedes afinarlas luego)
    base_coste = {
        "chatbot": 3000,
        "vision": 6000,
        "recomendador": 5000,
        "nlp": 4000,
        "otros": 3500,
    }

    equipo_multiplicador = {
        "pequeño": 1.0,
        "mediano": 1.5,
        "grande": 2.0
    }

    infra_coste = 1000 if input.infraestructura == "cloud" else 500
    datos_coste = 2000 if input.datos == "terceros" else 1000

    coste = base_coste.get(input.tipo, 3500)
    coste *= equipo_multiplicador.get(input.equipo, 1.0)
    coste += infra_coste + datos_coste
    coste_total = coste * (input.duracion_meses / 6)

    return {
        "coste_estimado": round(coste_total, 2),
        "desglose": {
            "base": base_coste.get(input.tipo, 3500),
            "infraestructura": infra_coste,
            "datos": datos_coste,
            "equipo": input.equipo,
            "duracion": input.duracion_meses
        }
    }
