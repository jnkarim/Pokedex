"use client";
import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";

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
  { gen: 9, start: 906, end: 1025, name: "Generation IX" }, // ✅ added
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
  generationRanges.find((g) => id >= g.start && id <= g.end)?.name ?? "Generation I";

export default function NationalPokedex() {
  const params = useParams();
  const [pokemonId, setPokemonId] = useState(Number(params?.id) || 1);
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "stats" | "evolution">("info");

  const parseEvolutionChain = async (chain: any): Promise<EvolutionNode> => {
    const getPokemonId = (url: string) => {
      const parts = url.split("/");
      return parseInt(parts[parts.length - 2]);
    };

    const parseNode = async (node: any): Promise<EvolutionNode> => {
      const id = getPokemonId(node.species.url);
      const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
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

  useEffect(() => {
    const fetchPokemonDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (!response.ok) throw new Error("Pokemon not found");
        const data = await response.json();

        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();

        const description =
          speciesData.flavor_text_entries
            .find((entry: any) => entry.language.name === "en")
            ?.flavor_text.replace(/\f/g, " ") || "No description available.";

        let evolutionChain = null;
        if (speciesData.evolution_chain) {
          const evolutionResponse = await fetch(speciesData.evolution_chain.url);
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
        setPokemon(details);
      } catch (e) {
        console.error("Error fetching Pokemon details:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPokemonDetails();
  }, [pokemonId]);

  const renderEvolutionChain = (node: EvolutionNode) => {
    return (
      <div className="flex items-center gap-3" key={node.id}>
        <div className="flex flex-col items-center">
          <div
            onClick={() => setPokemonId(node.id)}
            className={`bg-slate-800 rounded-lg p-2 border-2 cursor-pointer transition-all hover:scale-105 ${
              pokemon?.id === node.id ? "border-green-400 shadow-lg shadow-green-400/30" : "border-slate-600"
            }`}
          >
            <img src={node.image} alt={node.name} className="w-16 h-16 object-contain" />
          </div>
          <div className="text-green-300 text-xs mt-1 capitalize font-semibold">{node.name}</div>
          <div className="text-green-500 text-xs font-mono">#{node.id.toString().padStart(3, "0")}</div>
        </div>

        {node.evolvesTo.length > 0 && (
          <>
            <div className="flex flex-col items-center mx-1">
              <ArrowRight className="text-green-400" size={20} strokeWidth={2} />
              {node.evolvesTo[0].evolutionDetails?.minLevel && (
                <div className="text-xs text-green-300 font-bold">
                  Lv.{node.evolvesTo[0].evolutionDetails.minLevel}
                </div>
              )}
              {node.evolvesTo[0].evolutionDetails?.item && (
                <div className="text-xs text-green-300 font-bold capitalize">
                  {node.evolvesTo[0].evolutionDetails.item.replace(/-/g, " ")}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {node.evolvesTo.map((evolution) => renderEvolutionChain(evolution))}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 border-8 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-3xl font-bold">Loading Pokédex...</div>
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold">Pokémon Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-4 flex items-center justify-center overflow-auto">
      <div className="w-full max-w-6xl my-8">
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-20 -translate-x-1/2"></div>

          <div className="grid grid-cols-2 gap-3">
            {/* LEFT */}
            <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-3xl shadow-2xl border-8 border-red-950 p-6 relative">
              {/* lens strip unchanged ... */}

              <div className="bg-white rounded-2xl p-1 shadow-2xl border-4 border-slate-900">
                <div className="bg-slate-200 rounded-xl p-4 border-4 border-slate-400">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <div className="text-xs font-bold text-slate-600">MAIN DISPLAY</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-100 via-blue-50 to-purple-50 rounded-lg p-4 mb-3 relative h-64 flex items-center justify-center border-2 border-slate-300 shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-lg"></div>
                    <img src={pokemon.image} alt={pokemon.name} className="relative w-full h-full object-contain drop-shadow-2xl z-10" />
                  </div>

                  <div className="bg-green-600 rounded-lg p-3 mb-2 border-2 border-green-800 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold capitalize text-white tracking-wide">{pokemon.name}</h1>
                      <div className="text-green-200 font-bold text-lg bg-green-800 px-3 py-1 rounded">
                        #{pokemon.id.toString().padStart(3, "0")}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center">
                    {pokemon.types.map((type) => (
                      <span
                        key={type}
                        className="px-4 py-2 rounded-lg text-white font-bold capitalize text-sm shadow-md border-2 border-black/20"
                        style={{ backgroundColor: typeColors[type] }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPokemonId(Math.max(1, pokemonId - 1))}
                    disabled={pokemonId === 1}
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-cyan-400 font-bold py-3 rounded-lg shadow-lg transition-all border-3 border-black"
                  >
                    ← PREV
                  </button>
                  <button
                    onClick={() => setPokemonId(Math.min(NATIONAL_DEX_TOTAL, pokemonId + 1))}
                    disabled={pokemonId === NATIONAL_DEX_TOTAL}
                    className="bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold py-3 rounded-lg shadow-lg transition-all border-3 border-black"
                  >
                    NEXT →
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1 px-8 py-2">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="h-1 bg-red-950 rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border-8 border-slate-950 p-6">
              <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-xl p-4 border-4 border-black shadow-2xl mb-6">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`py-2 text-xs font-bold rounded transition-all border-2 ${
                      activeTab === "info"
                        ? "bg-green-400 text-black border-green-600"
                        : "bg-slate-900 text-green-400 border-green-900 hover:bg-slate-800"
                    }`}
                  >
                    INFO
                  </button>
                  <button
                    onClick={() => setActiveTab("stats")}
                    className={`py-2 text-xs font-bold rounded transition-all border-2 ${
                      activeTab === "stats"
                        ? "bg-green-400 text-black border-green-600"
                        : "bg-slate-900 text-green-400 border-green-900 hover:bg-slate-800"
                    }`}
                  >
                    STATS
                  </button>
                  <button
                    onClick={() => setActiveTab("evolution")}
                    className={`py-2 text-xs font-bold rounded transition-all border-2 ${
                      activeTab === "evolution"
                        ? "bg-green-400 text-black border-green-600"
                        : "bg-slate-900 text-green-400 border-green-900 hover:bg-slate-800"
                    }`}
                  >
                    EVOL
                  </button>
                </div>

                <div className="bg-black rounded-lg p-4 border-2 border-green-800 h-124 relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/5 to-transparent"></div>

                  <div className="relative z-10 text-green-400 font-mono text-sm h-full overflow-y-auto pr-2">
                    {activeTab === "info" && (
                      <div className="space-y-3">
                        <div className="text-green-300 font-bold mb-3 text-xs tracking-wider">► POKÉDEX ENTRY</div>

                        <div className="bg-slate-900/60 rounded p-3 border border-green-800">
                          <div className="text-green-300 leading-relaxed text-xs">{pokemon.description}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                            <div className="text-green-500 text-xs">HT</div>
                            <div className="text-yellow-400 font-bold">{(pokemon.height / 10).toFixed(1)}m</div>
                          </div>
                          <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                            <div className="text-green-500 text-xs">WT</div>
                            <div className="text-yellow-400 font-bold">{(pokemon.weight / 10).toFixed(1)}kg</div>
                          </div>
                        </div>

                        <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                          <div className="text-green-500 text-xs mb-1">ABILITIES</div>
                          <div className="space-y-1">
                            {pokemon.abilities.map((ability, idx) => (
                              <div key={idx} className="text-green-300 text-xs capitalize">
                                • {ability.replace(/-/g, " ")}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                          <div className="text-green-500 text-xs mb-1">MOVES</div>
                          <div className="grid grid-cols-2 gap-x-2">
                            {pokemon.moves.map((move, idx) => (
                              <div key={idx} className="text-green-300 text-xs capitalize">
                                • {move.replace(/-/g, " ")}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "stats" && (
                      <div className="space-y-3">
                        <div className="text-green-300 font-bold mb-3 text-xs tracking-wider">► BASE STATS</div>

                        {Object.entries(pokemon.stats).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-400 uppercase">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                              <span className="text-yellow-400 font-bold">{value}</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded h-2 border border-green-900">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-300 h-full rounded transition-all"
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
                        <div className="text-green-300 font-bold mb-3 text-xs tracking-wider">► EVOLUTION</div>

                        {pokemon.evolutionChain ? (
                          <div className="overflow-x-auto">
                            <div className="flex justify-start items-center min-w-max pb-2">
                              {renderEvolutionChain(pokemon.evolutionChain)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-green-400 text-xs">NO EVOLUTION DATA</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="space-y-4">
                <div className="bg-cyan-900 rounded-lg p-3 border-4 border-black shadow-xl">
                  <div className="bg-cyan-950 rounded p-2 border-2 border-cyan-700 h-20 flex items-center justify-center">
                    <div className="text-cyan-400 font-mono text-xs text-center">
                      <div className="mb-1">{getGenerationLabel(pokemon.id).toUpperCase()}</div>
                      <div className="text-cyan-300 font-bold text-lg">
                        {pokemon.id}/{NATIONAL_DEX_TOTAL}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <div className="w-14 h-8 bg-yellow-500 rounded-lg border-3 border-yellow-700 shadow-xl"></div>
                  <div className="w-14 h-8 bg-yellow-500 rounded-lg border-3 border-yellow-700 shadow-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
}"use client";
import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";

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
  { gen: 9, start: 906, end: 1025, name: "Generation IX" }, // ✅ added
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
  generationRanges.find((g) => id >= g.start && id <= g.end)?.name ?? "Generation I";

export default function NationalPokedex() {
  const params = useParams();
  const [pokemonId, setPokemonId] = useState(Number(params?.id) || 1);
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "stats" | "evolution">("info");

  const parseEvolutionChain = async (chain: any): Promise<EvolutionNode> => {
    const getPokemonId = (url: string) => {
      const parts = url.split("/");
      return parseInt(parts[parts.length - 2]);
    };

    const parseNode = async (node: any): Promise<EvolutionNode> => {
      const id = getPokemonId(node.species.url);
      const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
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

  useEffect(() => {
    const fetchPokemonDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (!response.ok) throw new Error("Pokemon not found");
        const data = await response.json();

        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();

        const description =
          speciesData.flavor_text_entries
            .find((entry: any) => entry.language.name === "en")
            ?.flavor_text.replace(/\f/g, " ") || "No description available.";

        let evolutionChain = null;
        if (speciesData.evolution_chain) {
          const evolutionResponse = await fetch(speciesData.evolution_chain.url);
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
        setPokemon(details);
      } catch (e) {
        console.error("Error fetching Pokemon details:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPokemonDetails();
  }, [pokemonId]);

  const renderEvolutionChain = (node: EvolutionNode) => {
    return (
      <div className="flex items-center gap-3" key={node.id}>
        <div className="flex flex-col items-center">
          <div
            onClick={() => setPokemonId(node.id)}
            className={`bg-slate-800 rounded-lg p-2 border-2 cursor-pointer transition-all hover:scale-105 ${
              pokemon?.id === node.id ? "border-green-400 shadow-lg shadow-green-400/30" : "border-slate-600"
            }`}
          >
            <img src={node.image} alt={node.name} className="w-16 h-16 object-contain" />
          </div>
          <div className="text-green-300 text-xs mt-1 capitalize font-semibold">{node.name}</div>
          <div className="text-green-500 text-xs font-mono">#{node.id.toString().padStart(3, "0")}</div>
        </div>

        {node.evolvesTo.length > 0 && (
          <>
            <div className="flex flex-col items-center mx-1">
              <ArrowRight className="text-green-400" size={20} strokeWidth={2} />
              {node.evolvesTo[0].evolutionDetails?.minLevel && (
                <div className="text-xs text-green-300 font-bold">
                  Lv.{node.evolvesTo[0].evolutionDetails.minLevel}
                </div>
              )}
              {node.evolvesTo[0].evolutionDetails?.item && (
                <div className="text-xs text-green-300 font-bold capitalize">
                  {node.evolvesTo[0].evolutionDetails.item.replace(/-/g, " ")}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {node.evolvesTo.map((evolution) => renderEvolutionChain(evolution))}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 border-8 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-3xl font-bold">Loading Pokédex...</div>
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold">Pokémon Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-4 flex items-center justify-center overflow-auto">
      <div className="w-full max-w-6xl my-8">
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-20 -translate-x-1/2"></div>

          <div className="grid grid-cols-2 gap-3">
            {/* LEFT */}
            <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-3xl shadow-2xl border-8 border-red-950 p-6 relative">
              {/* lens strip unchanged ... */}

              <div className="bg-white rounded-2xl p-1 shadow-2xl border-4 border-slate-900">
                <div className="bg-slate-200 rounded-xl p-4 border-4 border-slate-400">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <div className="text-xs font-bold text-slate-600">MAIN DISPLAY</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-100 via-blue-50 to-purple-50 rounded-lg p-4 mb-3 relative h-64 flex items-center justify-center border-2 border-slate-300 shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-lg"></div>
                    <img src={pokemon.image} alt={pokemon.name} className="relative w-full h-full object-contain drop-shadow-2xl z-10" />
                  </div>

                  <div className="bg-green-600 rounded-lg p-3 mb-2 border-2 border-green-800 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold capitalize text-white tracking-wide">{pokemon.name}</h1>
                      <div className="text-green-200 font-bold text-lg bg-green-800 px-3 py-1 rounded">
                        #{pokemon.id.toString().padStart(3, "0")}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center">
                    {pokemon.types.map((type) => (
                      <span
                        key={type}
                        className="px-4 py-2 rounded-lg text-white font-bold capitalize text-sm shadow-md border-2 border-black/20"
                        style={{ backgroundColor: typeColors[type] }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPokemonId(Math.max(1, pokemonId - 1))}
                    disabled={pokemonId === 1}
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-cyan-400 font-bold py-3 rounded-lg shadow-lg transition-all border-3 border-black"
                  >
                    ← PREV
                  </button>
                  <button
                    onClick={() => setPokemonId(Math.min(NATIONAL_DEX_TOTAL, pokemonId + 1))}
                    disabled={pokemonId === NATIONAL_DEX_TOTAL}
                    className="bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold py-3 rounded-lg shadow-lg transition-all border-3 border-black"
                  >
                    NEXT →
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1 px-8 py-2">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="h-1 bg-red-950 rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border-8 border-slate-950 p-6">
              <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-xl p-4 border-4 border-black shadow-2xl mb-6">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`py-2 text-xs font-bold rounded transition-all border-2 ${
                      activeTab === "info"
                        ? "bg-green-400 text-black border-green-600"
                        : "bg-slate-900 text-green-400 border-green-900 hover:bg-slate-800"
                    }`}
                  >
                    INFO
                  </button>
                  <button
                    onClick={() => setActiveTab("stats")}
                    className={`py-2 text-xs font-bold rounded transition-all border-2 ${
                      activeTab === "stats"
                        ? "bg-green-400 text-black border-green-600"
                        : "bg-slate-900 text-green-400 border-green-900 hover:bg-slate-800"
                    }`}
                  >
                    STATS
                  </button>
                  <button
                    onClick={() => setActiveTab("evolution")}
                    className={`py-2 text-xs font-bold rounded transition-all border-2 ${
                      activeTab === "evolution"
                        ? "bg-green-400 text-black border-green-600"
                        : "bg-slate-900 text-green-400 border-green-900 hover:bg-slate-800"
                    }`}
                  >
                    EVOL
                  </button>
                </div>

                <div className="bg-black rounded-lg p-4 border-2 border-green-800 h-124 relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/5 to-transparent"></div>

                  <div className="relative z-10 text-green-400 font-mono text-sm h-full overflow-y-auto pr-2">
                    {activeTab === "info" && (
                      <div className="space-y-3">
                        <div className="text-green-300 font-bold mb-3 text-xs tracking-wider">► POKÉDEX ENTRY</div>

                        <div className="bg-slate-900/60 rounded p-3 border border-green-800">
                          <div className="text-green-300 leading-relaxed text-xs">{pokemon.description}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                            <div className="text-green-500 text-xs">HT</div>
                            <div className="text-yellow-400 font-bold">{(pokemon.height / 10).toFixed(1)}m</div>
                          </div>
                          <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                            <div className="text-green-500 text-xs">WT</div>
                            <div className="text-yellow-400 font-bold">{(pokemon.weight / 10).toFixed(1)}kg</div>
                          </div>
                        </div>

                        <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                          <div className="text-green-500 text-xs mb-1">ABILITIES</div>
                          <div className="space-y-1">
                            {pokemon.abilities.map((ability, idx) => (
                              <div key={idx} className="text-green-300 text-xs capitalize">
                                • {ability.replace(/-/g, " ")}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-900/60 rounded p-2 border border-green-800">
                          <div className="text-green-500 text-xs mb-1">MOVES</div>
                          <div className="grid grid-cols-2 gap-x-2">
                            {pokemon.moves.map((move, idx) => (
                              <div key={idx} className="text-green-300 text-xs capitalize">
                                • {move.replace(/-/g, " ")}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "stats" && (
                      <div className="space-y-3">
                        <div className="text-green-300 font-bold mb-3 text-xs tracking-wider">► BASE STATS</div>

                        {Object.entries(pokemon.stats).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-400 uppercase">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                              <span className="text-yellow-400 font-bold">{value}</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded h-2 border border-green-900">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-300 h-full rounded transition-all"
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
                        <div className="text-green-300 font-bold mb-3 text-xs tracking-wider">► EVOLUTION</div>

                        {pokemon.evolutionChain ? (
                          <div className="overflow-x-auto">
                            <div className="flex justify-start items-center min-w-max pb-2">
                              {renderEvolutionChain(pokemon.evolutionChain)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-green-400 text-xs">NO EVOLUTION DATA</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="space-y-4">
                <div className="bg-cyan-900 rounded-lg p-3 border-4 border-black shadow-xl">
                  <div className="bg-cyan-950 rounded p-2 border-2 border-cyan-700 h-20 flex items-center justify-center">
                    <div className="text-cyan-400 font-mono text-xs text-center">
                      <div className="mb-1">{getGenerationLabel(pokemon.id).toUpperCase()}</div>
                      <div className="text-cyan-300 font-bold text-lg">
                        {pokemon.id}/{NATIONAL_DEX_TOTAL}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <div className="w-14 h-8 bg-yellow-500 rounded-lg border-3 border-yellow-700 shadow-xl"></div>
                  <div className="w-14 h-8 bg-yellow-500 rounded-lg border-3 border-yellow-700 shadow-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
}

