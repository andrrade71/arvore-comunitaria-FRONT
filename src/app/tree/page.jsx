"use client";
import React, { useEffect, useRef, useState } from "react";
import apiClient from "@/lib/apiClient";

export default function ArvoreComFolhas() {
  const canvasRef = useRef(null);
  const [folhas, setFolhas] = useState([]);
  const [folhaSelecionada, setFolhaSelecionada] = useState(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("authToken"));
  }, []);
  
  function isBrancoOuTransparente(r, g, b, a) {
    const tolerancia = 10;
    const isBranco =
      Math.abs(r - 255) <= tolerancia &&
      Math.abs(g - 255) <= tolerancia &&
      Math.abs(b - 255) <= tolerancia;
    const isTransparente = a < 10;
    return isBranco || isTransparente;
  }

  useEffect(() => {
    const img = new window.Image();
    img.src = "/assets/tree.png";
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Buscar folhas do "banco" via apiClient (com token JWT)
      apiClient
        .get("/api/commitment")
        .then((response) => {
          const folhasBanco = response.data;
          console.log("Folhas do banco:", folhasBanco);
          const posicoesPossiveis = [];
          for (let y = 0; y < canvas.height - 420; y += 30) {
            for (let x = 0; x < canvas.width; x += 10) {
              const index = (y * canvas.width + x) * 4;
              const r = pixels[index];
              const g = pixels[index + 1];
              const b = pixels[index + 2];
              const a = pixels[index + 3];
              if (!isBrancoOuTransparente(r, g, b, a)) {
                posicoesPossiveis.push({ x, y });
                x += 70;
                y += 1;
              }
            }
          }
          const folhasComDados = posicoesPossiveis
            .slice(0, folhasBanco.length)
            .map((pos, i) => ({
              ...pos,
              titulo: folhasBanco[i].titulo,
              autor: folhasBanco[i].usuarios?.nome || folhasBanco[i].nome,
              descricao: folhasBanco[i].descricao || folhasBanco[i].promessa,
            }));
          setFolhas(folhasComDados);
        })
        .catch(() => {
          setFolhas([]); // fallback em caso de erro
        });
    };
  }, []);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/assets/tree.png";
    img.onload = () => setImgSize({ w: img.width, h: img.height });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-green-100 overflow-auto">
      <div
        className="relative mx-auto"
        style={{ width: imgSize.w || 1, height: imgSize.h || 1 }}
      >
        {isLoggedIn ? (
          <a
            href="/dashboard"
            className="fixed bottom-6 left-6 z-[1100] bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-5 rounded-full shadow-lg flex items-center gap-2 transition-colors duration-200"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Voltar para Dashboard
          </a>
        ) : (
          <a
            href="/login"
            className="fixed bottom-6 left-6 z-[1100] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-full shadow-lg flex items-center gap-2 transition-colors duration-200"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Fazer Login
          </a>
        )}
        {/* Árvore */}
        <img
          src="/assets/tree.png"
          alt="Árvore"
          className="absolute top-0 left-0 w-full h-full pointer-events-none select-none"
        />

        {/* Folhas */}
        {folhas.map((f, i) => (
          <React.Fragment key={i}>
            <img
              src="/assets/leaf.png"
              alt="Folha"
              title={`Autor: ${f.autor}`}
              className="absolute cursor-pointer select-none"
              style={{ width: 60, height: 60, left: f.x - 8, top: f.y - 8 }}
              onClick={() => setFolhaSelecionada(f)}
            />
            <span
              className="absolute bg-white/80 px-2 py-0.5 rounded-lg text-xs font-bold pointer-events-none select-none text-black max-w-[120px] truncate"
              style={{ left: f.x + 20, top: f.y + 10 }}
              title={f.titulo}
            >
              {f.titulo}
            </span>
          </React.Fragment>
        ))}

        {/* Modal de descrição da folha */}
        {folhaSelecionada && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]"
            onClick={() => setFolhaSelecionada(null)}
          >
            <div
              className="bg-white rounded-xl px-6 py-8 min-w-[260px] max-w-md shadow-lg text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="m-0 mb-3 text-xl font-bold text-green-800">
                {folhaSelecionada.titulo}
              </h2>
              <p className="text-base m-0 text-black">
                <span className="block text-sm text-gray-600 mb-2">Autor: {folhaSelecionada.autor}</span>
                <span className="overflow-y-auto max-h-[50vh] block">
                  {folhaSelecionada.descricao}
                </span>
              </p>
              <button
                className="mt-6 px-4 py-1.5 rounded-md border-none bg-green-600 text-white font-bold text-base cursor-pointer"
                onClick={() => setFolhaSelecionada(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Canvas escondido apenas para leitura de pixels */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
