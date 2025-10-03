"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { X } from "lucide-react";

interface PokemonDetails {
  id: number;
  name: string;
  types: string[];
  image: string;
  height: number;
  weight: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  abilities: string[];
  moves: string[];
  description: string;
  evolutionChain: EvolutionNode | null;
}

interface EvolutionNode {
  id: number;
  name: string;
  image: string;
  evolvesTo: EvolutionNode[];
  evolutionDetails?: {
    minLevel?: number;
    item?: string;
    trigger?: string;
  };
}

const NATIONAL_DEX_TOTAL = 1025;
const generationRanges = [
  { gen: 1, start: 1, end: 151, name: "Generation I" },
  { gen: 2, start: 152, end: 251, name: "Generation II" },
  { gen: 3, start: 252, end: 386, name: "Generation III" },
  { gen: 4, start: 387, end: 493, name: "Generation IV" },
  { gen: 5, start: 494, end: 649, name: "Generation V" },
  { gen: 6, start: 650, end: 721, name: "Generation VI" },
  { gen: 7, start: 722, end: 809, name: "Generation VII" },
  { gen: 8, start: 810, end: 905, name: "Generation VIII" },
  { gen: 9, start: 906, end: 1025, name: "Generation IX" },
];

const typeColors: { [key: string]: string } = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

const getGenerationLabel = (id: number) =>
  generationRanges.find((g) => id >= g.start && id <= g.end)?.name ??
  "Generation I";

function speakFallback(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const v =
    voices.find(
      (vv) =>
        vv.lang?.toLowerCase().startsWith("en") &&
        /male|baritone|david|george|alex/i.test(vv.name)
    ) ||
    voices.find((vv) => vv.lang?.toLowerCase().startsWith("en")) ||
    voices[0];
  if (v) u.voice = v;
  u.rate = 0.9;
  u.pitch = 1.05;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function PokedexModal({
  open,
  onClose,
  initialPokemonId = 1,
}: {
  open: boolean;
  onClose: () => void;
  initialPokemonId?: number;
}) {
  const [pokemonId, setPokemonId] = useState(initialPokemonId);
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "stats" | "evolution">(
    "info"
  );
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Reset when opened
  useEffect(() => {
    if (open) setPokemonId(initialPokemonId);
  }, [open, initialPokemonId]);

  // ESC & arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setPokemonId((id) => Math.max(1, id - 1));
      if (e.key === "ArrowRight")
        setPokemonId((id) => Math.min(NATIONAL_DEX_TOTAL, id + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Parse evolution helper
  const parseEvolutionChain = async (chain: any): Promise<EvolutionNode> => {
    const getPokemonId = (url: string) => {
      const parts = url.split("/");
      return parseInt(parts[parts.length - 2]);
    };

    const parseNode = async (node: any): Promise<EvolutionNode> => {
      const id = getPokemonId(node.species.url);
      const pokemonResponse = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${id}`
      );
      const pokemonData = await pokemonResponse.json();

      const evolutionNode: EvolutionNode = {
        id,
        name: node.species.name,
        image: pokemonData.sprites.other["official-artwork"].front_default,
        evolvesTo: [],
      };

      if (node.evolution_details && node.evolution_details.length > 0) {
        const detail = node.evolution_details[0];
        evolutionNode.evolutionDetails = {
          minLevel: detail?.min_level,
          item: detail?.item?.name,
          trigger: detail?.trigger?.name,
        };
      }

      if (node.evolves_to && node.evolves_to.length > 0) {
        evolutionNode.evolvesTo = await Promise.all(
          node.evolves_to.map((evo: any) => parseNode(evo))
        );
      }

      return evolutionNode;
    };

    return parseNode(chain);
  };

  // Fetch Pokémon details
  useEffect(() => {
    if (!open) return;

    let alive = true;
    const idAtRequest = pokemonId;
    const controller = new AbortController();

    (async () => {
      try {
        setActiveTab("info");
        setPokemon(null);
        setLoading(true);
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${idAtRequest}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Pokemon not found");
        const data = await response.json();

        const speciesResponse = await fetch(data.species.url, {
          signal: controller.signal,
        });
        const speciesData = await speciesResponse.json();

        const description =
          speciesData.flavor_text_entries
            .find((entry: any) => entry.language.name === "en")
            ?.flavor_text.replace(/\f/g, " ") || "No description available.";

        let evolutionChain = null;
        if (speciesData.evolution_chain) {
          const evolutionResponse = await fetch(
            speciesData.evolution_chain.url,
            { signal: controller.signal }
          );
          const evolutionData = await evolutionResponse.json();
          evolutionChain = await parseEvolutionChain(evolutionData.chain);
        }

        const details: PokemonDetails = {
          id: data.id,
          name: data.name,
          types: data.types.map((t: any) => t.type.name),
          image: data.sprites.other["official-artwork"].front_default,
          height: data.height,
          weight: data.weight,
          stats: {
            hp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            specialAttack: data.stats[3].base_stat,
            specialDefense: data.stats[4].base_stat,
            speed: data.stats[5].base_stat,
          },
          abilities: data.abilities.map((a: any) => a.ability.name),
          moves: data.moves.slice(0, 10).map((m: any) => m.move.name),
          description,
          evolutionChain,
        };

        // Ignore stale results
        if (!alive || idAtRequest !== pokemonId) return;

        setPokemon(details);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error("Error fetching Pokemon details:", e);
        if (alive) setPokemon(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // cleanup cancels the in-flight fetch when id changes or modal closes
    return () => {
      alive = false;
      controller.abort();
    };
  }, [pokemonId, open]);

  const renderEvolutionChain = (node: EvolutionNode) => {
    return (
      <div className="flex flex-col justify-center gap-1" key={node.id}>
        <div className="flex flex-col items-center">
          <div
            onClick={() => setPokemonId(node.id)}
            className={`bg-slate-800 rounded-lg p-2 border-2 cursor-pointer transition-all hover:scale-105 ${
              pokemon?.id === node.id
                ? "border-green-400 shadow-lg shadow-green-400/30"
                : "border-slate-600"
            }`}
          >
            <img
              src={node.image}
              alt={node.name}
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="text-[#E9E4D7] text-xs mt-0.5 capitalize font-semibold">
            {node.name}
          </div>
          <div className="text-green-500 text-xs font-mono">
            #{String(node.id).padStart(3, "0")}
          </div>
        </div>

        {node.evolvesTo.length > 0 && (
          <>
            <div className="flex flex-col justify-center items-center">
              <ArrowRight
                className="text-green-400 rotate-90"
                size={16}
                strokeWidth={2}
              />
              {node.evolvesTo[0].evolutionDetails?.minLevel && (
                <div className="text-xs text-[#E9E4D7] font-bold">
                  Lv.{node.evolvesTo[0].evolutionDetails.minLevel}
                </div>
              )}
              {node.evolvesTo[0].evolutionDetails?.item && (
                <div className="text-xs text-[#E9E4D7] font-bold capitalize">
                  {node.evolvesTo[0].evolutionDetails.item.replace(/-/g, " ")}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {node.evolvesTo.map((evolution) =>
                renderEvolutionChain(evolution)
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const content = useMemo(() => {
    if (loading) {
      return (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Loader Box */}
          <div className="relative z-10 w-[380px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-4 border-green-500/40 rounded-2xl shadow-2xl p-6 flex flex-col items-center">
            <div className="relative mb-5">
              <div className="w-20 h-20 border-[10px] border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/pball.png"
                  alt="Pokéball"
                  className="w-10 h-10 animate-pulse"
                />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-green-400 font-mono text-lg animate-pulse tracking-wider">
                Loading Pokédex…
              </h2>
            </div>
            <div className="mt-5 w-full bg-slate-700 border border-slate-600 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-green-400 animate-[loadingbar_2s_linear_infinite]" />
            </div>
          </div>

          <style jsx>{`
            @keyframes loadingbar {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }
          `}</style>
        </div>
      );
    }

    if (!pokemon) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-10">
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold">Pokémon Not Found</h1>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* LEFT */}
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-3xl shadow-2xl border-6 border-red-950 p-4 relative">
          <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl p-1 shadow-2xl border-4 border-slate-900">
            <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 px-2">
                {/* blue lens */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center relative flex-shrink-0 hover:scale-110 transition-transform cursor-pointer">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-800 rounded-full"></div>
                    <div className="absolute w-3 h-3 bg-white rounded-full opacity-80 transform -translate-x-2 -translate-y-2"></div>
                  </div>

                  <div className="flex gap-2 items-start">
                    <div className="w-3.5 h-3.5 bg-red-800 rounded-full shadow-lg"></div>
                    <div className="w-3.5 h-3.5 bg-yellow-600 rounded-full shadow-lg"></div>
                    <div className="w-3.5 h-3.5 bg-green-800 rounded-full shadow-lg"></div>
                  </div>
                </div>
              </div>

              <div className="relative bg-black rounded-md p-3 mb-6 h-64 flex items-center justify-center border-[22px] border-[#E9E4D7] shadow-inner overflow-visible">
                {/* Two straight lines in column at red circle position */}
                <div className="absolute -bottom-4 left-62 flex flex-col gap-1 z-20">
                  <div className="w-8 h-1 bg-[#E9E4D7] border border-black"></div>
                  <div className="w-8 h-1 bg-[#E9E4D7] border border-black"></div>
                </div>

                {/* Red circle positioned between the border and black frame */}
                <div className="absolute -bottom-4.5 left-2 w-4 h-4 bg-red-700 rounded-full shadow-lg z-20"></div>

                <img
                  src={pokemon.image}
                  alt={pokemon.name}
                  className="relative w-full h-full object-contain drop-shadow-2xl z-10 animate-float"
                  key={pokemon.id}
                />
              </div>

              <div className="bg-black rounded-lg p-3 mb-2 border-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold capitalize text-white tracking-wide">
                    {pokemon.name}
                  </h1>
                  <div className="text-[#FAF9F6] font-bold text-lg bg-slate-900 px-3 py-1 rounded">
                    #{String(pokemon.id).padStart(3, "0")}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                {pokemon.types.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1.5 rounded-lg text-[#E9E4D7] font-bold capitalize text-sm shadow-md border-2 border-black/20"
                    style={{ backgroundColor: typeColors[type] }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {/* Controls row */}
            <div className="flex justify-between items-center px-10">
              <div className="w-8 h-8 bg-slate-900 rounded-full shadow-lg"></div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (pokemon) speakFallback(pokemon.name);
                  }}
                  className="w-20 h-10 bg-green-800 border-2 border-black text-[#E9E4D7] font-bold text-xs rounded hover:bg-green-700 transition"
                >
                  Voice
                </button>
              </div>

              <div className="relative w-14 h-14">
                <div className="absolute w-4 h-14 bg-slate-900 left-1/2 -translate-x-1/2"></div>
                <div className="absolute w-14 h-4 bg-slate-900 top-1/2 -translate-y-1/2"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-2">
              <button
                onClick={() => setPokemonId((id) => Math.max(1, id - 1))}
                disabled={pokemonId === 1}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-[#E9E4D7] font-bold py-2.5 rounded-lg shadow-lg transition-all border-[3px] border-black"
              >
                ← PREV
              </button>
              <button
                onClick={() =>
                  setPokemonId((id) => Math.min(NATIONAL_DEX_TOTAL, id + 1))
                }
                disabled={pokemonId === NATIONAL_DEX_TOTAL}
                className="bg-slate-900 hover:bg-slate-800 text-[#E9E4D7] font-bold py-2.5 rounded-lg shadow-lg transition-all border-[3px] border-black"
              >
                NEXT →
              </button>
            </div>

            <div className="grid grid-cols-6 gap-1 px-6 py-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="h-1 bg-red-950 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-3xl shadow-2xl border-6 border-slate-950 p-4">
          <RightPane
            pokemon={pokemon}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            renderEvolutionChain={renderEvolutionChain}
          />

          {/* Bottom Controls */}
          <div className="space-y-4 mt-5">
            <div className="bg-slate-900 rounded-lg p-3 border-4 border-black shadow-xl">
              <div className="bg-slate-950 rounded p-2 border-2 border-slate-900 h-20 flex items-center justify-center">
                <div className="text-[#E9E4D7] font-mono text-xs text-center">
                  <div className="mb-1">
                    {getGenerationLabel(pokemon.id).toUpperCase()}
                  </div>
                  <div className="text-[#E9E4D7] font-bold text-lg">
                    {pokemon.id}/{NATIONAL_DEX_TOTAL}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <div className="w-12 h-8 bg-[#E9E4D7] border-2 border-black shadow-xl"></div>
              <div className="w-12 h-8 bg-[#E9E4D7] border-2 border-black shadow-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [loading, pokemon, pokemonId, activeTab]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative mx-auto my-5 h-[92vh] w-[94vw] max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={(e) => {
            e.stopPropagation(); 
            onClose(); 
          }}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center
             rounded-full border border-white/10 bg-black/40 text-white
             hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <X size={18} />
        </button>

        <div className="pointer-events-none absolute left-1/2 inset-y-3 w-[3px] -translate-x-1/2 bg-slate-900/85 z-0 rounded-full" />

        <div className="relative h-full w-full overflow-auto z-10">
          <div className="w-full py-5 px-2 md:px-4">{content}</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.02);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function RightPane({
  pokemon,
  activeTab,
  setActiveTab,
  renderEvolutionChain,
}: {
  pokemon: PokemonDetails;
  activeTab: "info" | "stats" | "evolution";
  setActiveTab: (t: "info" | "stats" | "evolution") => void;
  renderEvolutionChain: (node: EvolutionNode) => React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-xl p-4 border-4 border-black shadow-2xl">
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => setActiveTab("info")}
          className={`py-2 text-xs font-bold rounded transition-all border-2 ${
            activeTab === "info"
              ? "bg-sky-400 text-black border-green-600"
              : "bg-slate-900 text-[#E9E4D7] border-green-900 hover:bg-slate-800"
          }`}
        >
          INFO
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`py-2 text-xs font-bold rounded transition-all border-2 ${
            activeTab === "stats"
              ? "bg-sky-400 text-black border-green-600"
              : "bg-slate-900 text-[#E9E4D7] border-green-900 hover:bg-slate-800"
          }`}
        >
          STATS
        </button>
        <button
          onClick={() => setActiveTab("evolution")}
          className={`py-2 text-xs font-bold rounded transition-all border-2 ${
            activeTab === "evolution"
              ? "bg-sky-400 text-black border-green-600"
              : "bg-slate-900 text-[#E9E4D7] border-green-900 hover:bg-slate-800"
          }`}
        >
          EVOL
        </button>
      </div>

      <div className="bg-black rounded-lg p-4 border-2 border-green-800 min-h-[28rem] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/5 to-transparent"></div>

        <div className="relative z-10 text-green-400 font-mono text-sm h-full overflow-y-auto pr-2">
          {activeTab === "info" && (
            <div className="space-y-3">
              <div className="text-[#E9E4D7] font-bold mb-3 text-xs tracking-wider">
                ► POKÉDEX ENTRY
              </div>

              <div className="bg-slate-900/60 rounded p-3 border border-green-800">
                <div className="text-[#E9E4D7] leading-relaxed text-xs">
                  {pokemon.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                  <div className="text-green-500 text-xs">HT</div>
                  <div className="text-yellow-400 font-bold">
                    {(pokemon.height / 10).toFixed(1)}m
                  </div>
                </div>
                <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                  <div className="text-green-500 text-xs">WT</div>
                  <div className="text-yellow-400 font-bold">
                    {(pokemon.weight / 10).toFixed(1)}kg
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                <div className="text-green-500 text-xs mb-1">ABILITIES</div>
                <div className="space-y-1">
                  {pokemon.abilities.map((ability, idx) => (
                    <div
                      key={idx}
                      className="text-[#E9E4D7] text-xs capitalize"
                    >
                      • {ability.replace(/-/g, " ")}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                <div className="text-green-500 text-xs mb-1">MOVES</div>
                <div className="grid grid-cols-2 gap-x-2">
                  {pokemon.moves.map((move, idx) => (
                    <div
                      key={idx}
                      className="text-[#E9E4D7] text-xs capitalize"
                    >
                      • {move.replace(/-/g, " ")}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="space-y-3">
              <div className="text-[#E9E4D7] font-bold mb-3 text-xs tracking-wider">
                ► BASE STATS
              </div>

              {Object.entries(pokemon.stats).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400 uppercase">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-yellow-400 font-bold">{value}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded h-2 border border-green-900">
                    <div
                      className="bg-green-400 h-full rounded transition-all"
                      style={{ width: `${(value / 255) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              <div className="pt-3 mt-3 border-t border-green-800">
                <div className="flex justify-between items-center">
                  <span className="text-green-400 text-xs">TOTAL</span>
                  <span className="text-yellow-400 font-bold text-xl">
                    {Object.values(pokemon.stats).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "evolution" && (
            <div className="space-y-3">
              <div className="text-[#E9E4D7] font-bold mb-3 text-xs tracking-wider text-center">
                ► EVOLUTION
              </div>

              {pokemon.evolutionChain ? (
                <div className="overflow-x-auto">
                  <div className="flex justify-center items-center min-w-max pb-2">
                    {renderEvolutionChain(pokemon.evolutionChain)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-green-400 text-xs">
                  NO EVOLUTION DATA
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
