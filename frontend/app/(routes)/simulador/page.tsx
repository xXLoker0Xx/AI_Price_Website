'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Simulador() {
  const [projectType, setProjectType] = useState('chatbot');

  const projectOptions = [
    { value: 'chatbot', label: 'Chatbot' },
    { value: 'vision', label: 'Visión por computadora' },
    { value: 'recomendador', label: 'Sistema recomendador' },
    { value: 'nlp', label: 'Procesamiento de lenguaje' },
    { value: 'otros', label: 'Otro tipo de IA' },
  ];

  return (
    <main className="min-h-screen bg-light text-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md sm:max-w-lg mx-auto text-center flex items-center justify-center flex-col">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Paso 1: Tipo de proyecto</h2>

        <p className="text-gray-600 mb-8">
          Selecciona el tipo de sistema de IA que deseas implementar:
        </p>

        <div className="space-y-3 mb-10">
          {projectOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setProjectType(option.value)}
              className={`w-full px-6 py-3 rounded-2xl shadow-soft text-left transition-all border hover:cursor-pointer ${
                projectType === option.value
                  ? 'bg-dark text-white'
                  : 'bg-white text-black hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Link href="/calculadora">
          <button className="bg-dark text-white px-8 py-3 rounded-2xl shadow-soft hover:scale-105 hover:opacity-90 transition-all">
            Siguiente paso →
          </button>
        </Link>
      </div>
    </main>
  );
}
