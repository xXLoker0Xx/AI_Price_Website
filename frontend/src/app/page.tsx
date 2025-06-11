'use client';

import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-light text-dark px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
          Simulador de Coste IA
        </h1>
        <p className="text-lg md:text-xl text-gray-500 mb-10">
          Calcula el coste de implementar IA en tu empresa, con una interfaz clara y precisa.
        </p>
        <Link href="/simulador">
          <button className="bg-dark text-white text-lg px-8 py-3 rounded-2xl shadow-soft hover:scale-105 hover:opacity-90 transition-all">
            Empezar simulación →
          </button>
        </Link>
      </div>
    </main>
  );
}

