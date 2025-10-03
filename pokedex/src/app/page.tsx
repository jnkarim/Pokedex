"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, X, ArrowUp } from "lucide-react";
import {
  GiSeaDragon,
  GiFluffyWing,
  GiMountaintop,
  GiStonePile,
  GiFallingLeaf,
  GiFairyWings,
  GiCircularSawblade,
} from "react-icons/gi";
import {
  RiCheckboxBlankCircleLine,
  RiBugFill,
  RiGhostLine,
  RiFireFill,
} from "react-icons/ri";
import { LiaHandRockSolid } from "react-icons/lia";
import { IoWaterOutline } from "react-icons/io5";
import { AiFillThunderbolt } from "react-icons/ai";
import { MdDarkMode } from "react-icons/md";
import { LuSnowflake } from "react-icons/lu";
import { FaEye, FaSkullCrossbones, FaGithub, FaLinkedin } from "react-icons/fa";
import { MdCatchingPokemon } from "react-icons/md";

import PokedexModal from "@/app/components/PokedexModal";

interface Pokemon {
  id: number;
  name: string;
  types: string[];
  image: string;
  animatedImage: string;
  height: number;
  weight: number;
  generation: number;
  isLegendary?: boolean;
}

const Home: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [showLegendaryOnly, setShowLegendaryOnly] = useState(false);
  const [hoveredPokemon, setHoveredPokemon] = useState<number | null>(null);
  const [showGenDropdown, setShowGenDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [displayCount, setDisplayCount] = useState(100);
  const [isMobile, setIsMobile] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPokemonId, setModalPokemonId] = useState<number>(1);

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

  const typeIcons: { [key: string]: React.ReactNode } = {
    normal: <RiCheckboxBlankCircleLine size={18} />,
    fire: <RiFireFill size={18} />,
    water: <IoWaterOutline size={18} />,
    electric: <AiFillThunderbolt size={18} />,
    grass: <GiFallingLeaf size={18} />,
    ice: <LuSnowflake size={18} />,
    fighting: <LiaHandRockSolid size={18} />,
    poison: <FaSkullCrossbones size={18} />,
    ground: <GiMountaintop size={18} />,
    flying: <GiFluffyWing size={18} />,
    psychic: <FaEye size={18} />,
    bug: <RiBugFill size={18} />,
    rock: <GiStonePile size={18} />,
    ghost: <RiGhostLine size={18} />,
    dragon: <GiSeaDragon size={18} />,
    dark: <MdDarkMode size={18} />,
    steel: <GiCircularSawblade size={18} />,
    fairy: <GiFairyWings size={18} />,
  };

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

  const legendaryPokemon = [
    144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380,
    381, 382, 383, 384, 385, 386, 480, 481, 482, 483, 484, 485, 486, 487, 488,
    489, 490, 491, 492, 493, 494, 638, 639, 640, 641, 642, 643, 644, 645, 646,
    647, 648, 649, 716, 717, 718, 719, 720, 721, 772, 773, 785, 786, 787, 788,
    789, 790, 791, 792, 800, 801, 802, 807, 808, 809, 888, 889, 890, 891, 892,
    893, 894, 895, 896, 897, 898,
  ];

  const getGeneration = (id: number) => {
    const gen = generationRanges.find((g) => id >= g.start && id <= g.end);
    return gen ? gen.gen : 1;
  };


  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 640px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      setIsMobile(mobile);
      setDisplayCount(mobile ? 50 : 100);
    };
    // Initial
    handler(mql);
    // Listen
    const listener = (e: MediaQueryListEvent) => handler(e);
    mql.addEventListener ? mql.addEventListener("change", listener) : mql.addListener(listener as any);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", listener) : mql.removeListener(listener as any);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
        const data = await response.json();

        const pokemonDetails = await Promise.all(
          data.results.map(async (p: any) => {
            const detailResponse = await fetch(p.url);
            const detail = await detailResponse.json();
            return {
              id: detail.id,
              name: detail.name,
              types: detail.types.map((t: any) => t.type.name),
              image: detail.sprites.other["official-artwork"].front_default,
              animatedImage:
                detail.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.front_default ||
                detail.sprites.front_default,
              height: detail.height,
              weight: detail.weight,
              generation: getGeneration(detail.id),
              isLegendary: legendaryPokemon.includes(detail.id),
            } as Pokemon;
          })
        );

        setPokemon(pokemonDetails);
      } catch (error) {
        console.error("Error fetching Pokemon:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemon();
  }, []); 

  const filteredPokemon = useMemo(() => {
    const st = searchTerm.toLowerCase();
    return pokemon.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(st) || p.id.toString().includes(st);
      const matchesType = !selectedType || p.types.includes(selectedType);
      const matchesGeneration = !selectedGeneration || p.generation === selectedGeneration;
      const matchesLegendary = !showLegendaryOnly || p.isLegendary;
      return matchesSearch && matchesType && matchesGeneration && matchesLegendary;
    });
  }, [pokemon, searchTerm, selectedType, selectedGeneration, showLegendaryOnly]);

  const displayedPokemon = filteredPokemon.slice(0, displayCount);
  const hasMore = displayCount < filteredPokemon.length;

  const loadMore = () => setDisplayCount((prev) => prev + (isMobile ? 50 : 100));

  // Reset display count when filters change (keep mobile 24 rule)
  useEffect(() => {
    setDisplayCount(isMobile ? 24 : 100);
  }, [searchTerm, selectedType, selectedGeneration, showLegendaryOnly, isMobile]);

  if (loading) {
    return (
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Loader Box */}
        <div className="relative z-10 w-[420px] max-w-[90vw] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-4 border-green-500/40 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
          {/* Animated Pokéball */}
          {!isMobile && (
            <div className="relative mb-6">
              <div className="w-24 h-24 border-[10px] border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/pball.png" alt="Pokéball" className="w-12 h-12 animate-pulse" />
              </div>
            </div>
          )}

          {/* Text */}
          <div className="text-center">
            <h2 className="text-green-400 font-mono text-xl animate-pulse tracking-wider">Loading Pokédex…</h2>
          </div>

          {/* Pixel style bar */}
          <div className="mt-6 w-full bg-slate-700 border border-slate-600 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-green-400 animate-[loadingbar_2s_linear_infinite]" />
          </div>
        </div>

        <style jsx>{`
          @keyframes loadingbar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  const openModalFor = (id: number) => {
    setModalPokemonId(id);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 relative overflow-hidden">
 <svg
  className="absolute bottom-0 left-0 w-full h-8 md:h-[60px]"
  viewBox="0 0 1440 100"
  preserveAspectRatio="none"
>

            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#1a1a1a" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d="M0,20 C240,90 480,20 720,50 C960,80 1200,20 1440,90 L1440,100 L0,100 Z"
              fill="url(#waveGradient)"
            >
              <animate
                attributeName="d"
                dur="8s"
                repeatCount="indefinite"
                values="
                  M0,50 C240,80 480,20 720,50 C960,80 1200,20 1440,50 L1440,100 L0,100 Z;
                  M0,50 C240,20 480,80 720,50 C960,20 1200,80 1440,50 L1440,100 L0,100 Z;
                  M0,50 C240,80 480,20 720,50 C960,80 1200,20 1440,50 L1440,100 L0,100 Z"
              />
            </path>
            <path
              d="M0,60 C240,90 480,30 720,60 C960,90 1200,30 1440,60 L1440,100 L0,100 Z"
              fill="#000000"
              opacity="0.5"
            >
              <animate
                attributeName="d"
                dur="10s"
                repeatCount="indefinite"
                values="
                  M0,60 C240,90 480,30 720,60 C960,90 1200,30 1440,60 L1440,100 L0,100 Z;
                  M0,60 C240,30 480,90 720,60 C960,30 1200,90 1440,60 L1440,100 L0,100 Z;
                  M0,60 C240,90 480,30 720,60 C960,90 1200,30 1440,60 L1440,100 L0,100 Z"
              />
            </path>
          </svg>
        
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-5">
            {/* Left Side - Pokeball Button and Lights */}
            <div className="flex gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center relative flex-shrink-0 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-800 rounded-full"></div>
                {!isMobile && <div className="absolute w-3.5 h-3.5 bg-white rounded-full opacity-80 transform -translate-x-2 -translate-y-2"></div>}
              </div>

              {!isMobile && (
                <div className="flex gap-2 py-2">
                  <div className="w-3.5 h-3.5 bg-red-700 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                  <div
                    className="w-3.5 h-3.5 bg-yellow-500 rounded-full border-2 border-white shadow-lg animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-3.5 h-3.5 bg-green-700 rounded-full border-2 border-white shadow-lg animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              )}
            </div>

            {/* Center - Logo */}
            <div className="flex-shrink-0">
              <img
                src="/pokedex_logo.png"
                alt="Pokedex Logo"
                className="h-16 w-auto object-contain drop-shadow-xl"
              />
            </div>

            {/* Right Side - Pokeball */}
            {!isMobile && (
              <div className="animate-spin flex-shrink-0" style={{ animationDuration: "20s" }}>
                <img src="/pball.png" alt="Pokeball" className="w-16 h-16 object-contain" />
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-4xl mx-auto mb-16">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={20} />
            <input
              type="text"
              placeholder="Search Pokémon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black pl-12 pr-12 py-3.5 rounded-2xl border-2 border-red-800 text-base focus:outline-none shadow-xl transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Types */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-white text-3xl font-bold mb-6">Types</h2>

        <div className="flex flex-wrap gap-3 justify-center">
          {Object.keys(typeColors).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white transition-all duration-300 ${
                selectedType === type
                  ? "ring-4 ring-white scale-105"
                  : selectedType
                  ? "opacity-40"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: typeColors[type] }}
            >
              <span className="text-xl">{typeIcons[type]}</span>
              <span className="capitalize text-sm">{type}</span>
            </button>
          ))}
        </div>

        {selectedType && (
          <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <p className="text-white text-lg">
              <span className="text-gray-400">Filtering by:</span>{" "}
              <span className="font-bold text-xl ml-2" style={{ color: typeColors[selectedType] }}>
                {selectedType.toUpperCase()}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Sorting */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-white text-3xl font-bold mb-2">Find Pokémons</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game Generation Dropdown */}
          <div className="relative">
            <h3 className="text-yellow-500 font-bold mb-3 text-lg">Game Generation</h3>
            <button
              onClick={() => {
                setShowGenDropdown(!showGenDropdown);
                setShowSortDropdown(false);
              }}
              className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg flex items-center justify-between hover:border-gray-500 transition-all"
            >
              <span>
                {selectedGeneration
                  ? `Generation ${
                      selectedGeneration === 1
                        ? "I"
                        : selectedGeneration === 2
                        ? "II"
                        : selectedGeneration === 3
                        ? "III"
                        : selectedGeneration === 4
                        ? "IV"
                        : selectedGeneration === 5
                        ? "V"
                        : selectedGeneration === 6
                        ? "VI"
                        : selectedGeneration === 7
                        ? "VII"
                        : selectedGeneration === 8
                        ? "VIII"
                        : "IX"
                    }`
                  : "All"}
              </span>
              <svg
                className={`w-5 h-5 transition-transform ${showGenDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showGenDropdown && (
              <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedGeneration(null);
                    setShowGenDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${
                    selectedGeneration === null ? "bg-gray-700 text-white" : "text-gray-300"
                  }`}
                >
                  All
                </button>
                {generationRanges.map((gen) => (
                  <button
                    key={gen.gen}
                    onClick={() => {
                      setSelectedGeneration(gen.gen);
                      setShowGenDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${
                      selectedGeneration === gen.gen ? "bg-gray-700 text-white" : "text-gray-300"
                    }`}
                  >
                    Generation {["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"][gen.gen - 1]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Pokemon Dropdown */}
          <div className="relative">
            <h3 className="text-yellow-500 font-bold mb-3 text-lg">Sort Pokémon</h3>
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowGenDropdown(false);
              }}
              className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg flex items-center justify-between hover:border-gray-500 transition-all"
            >
              <span>{showLegendaryOnly ? "Legendary" : "Number"}</span>
              <svg
                className={`w-5 h-5 transition-transform ${showSortDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSortDropdown && (
              <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50">
                <button
                  onClick={() => {
                    setShowLegendaryOnly(false);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${
                    !showLegendaryOnly ? "bg-gray-700 text-white" : "text-gray-300"
                  }`}
                >
                  Number
                </button>
                <button
                  onClick={() => {
                    setShowLegendaryOnly(true);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                    showLegendaryOnly ? "bg-gray-700 text-white" : "text-gray-300"
                  }`}
                >
                  <MdCatchingPokemon size={16} className="bg-red-500" />
                  Legendary
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pokemon Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="mb-6">
          <p className="text-gray-400 text-lg">
            Showing <span className="text-white font-bold">{displayedPokemon.length}</span> of{" "}
            <span className="text-white font-bold">{filteredPokemon.length}</span> Pokémon
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayedPokemon.map((p) => (
            <button
              key={p.id}
              className="text-left bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700 hover:border-gray-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer group relative"
              onMouseEnter={() => setHoveredPokemon(p.id)}
              onMouseLeave={() => setHoveredPokemon(null)}
              onClick={() => openModalFor(p.id)}
            >
              {p.isLegendary && (
                <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <MdCatchingPokemon size={10} />
                  Legendary
                </div>
              )}
              <div className="relative bg-gray-700/50 rounded-xl p-4 mb-3">
                <img
                  src={hoveredPokemon === p.id && !isMobile ? p.animatedImage : p.image}
                  alt={p.name}
                  className="w-full h-32 object-contain group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded">
                  #{p.id.toString().padStart(3, "0")}
                </div>
              </div>
              <h3 className="text-white font-bold text-lg capitalize mb-2 text-center">{p.name}</h3>
              <div className="flex gap-2 justify-center flex-wrap">
                {p.types.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1"
                    style={{ backgroundColor: typeColors[type] }}
                  >
                    <span className="text-sm">{typeIcons[type]}</span>
                    {type}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {filteredPokemon.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-500 text-2xl mb-4">No Pokémon found</div>
            <p className="text-gray-600">Try adjusting your search or filter</p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Load More Pokémon ({filteredPokemon.length - displayCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50 hover:from-red-600 hover:to-red-700 group"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} className="group-hover:animate-bounce" />
        </button>
      )}

      {/* Footer */}
      <footer className="mt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-md">Gotta catch 'em all!</p>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/jnkarim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                >
                  <FaGithub size={28} />
                </a>
                <a
                  href="https://linkedin.com/in/jnkarim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-500 transition-all duration-300 hover:scale-110"
                >
                  <FaLinkedin size={28} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Pokedex Modal */}
   <PokedexModal
  open={modalOpen}
  onClose={() => {
    console.log("onClose called");   // should appear
    setModalOpen(false);
  }}
  initialPokemonId={modalPokemonId}
/>
    </div>
  );
};

export default Home;
