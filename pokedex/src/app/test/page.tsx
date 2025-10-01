"use client";
import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
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
import { FaEye, FaSkullCrossbones, FaCrown } from "react-icons/fa";

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
  const [loading, setLoading] = useState(true);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(
    null
  );
  const [showLegendaryOnly, setShowLegendaryOnly] = useState(false);
  const [hoveredPokemon, setHoveredPokemon] = useState<number | null>(null);
  const [showGenDropdown, setShowGenDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

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

  const legendaryPokemon = [
    144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380,
    381, 382, 383, 384, 385, 386, 480, 481, 482, 483, 484, 485, 486, 487, 488,
    489, 490, 491, 492, 493, 494, 638, 639, 640, 641, 642, 643, 644, 645, 646,
    647, 648, 649, 716, 717, 718, 719, 720, 721, 772, 773, 785, 786, 787, 788,
    789, 790, 791, 792, 800, 801, 802, 807, 808, 809, 888, 889, 890, 891, 892,
    893, 894, 895, 896, 897, 898,
  ];

  const generationRanges = [
    { gen: 1, start: 1, end: 151, name: "Generation I" },
    { gen: 2, start: 152, end: 251, name: "Generation II" },
    { gen: 3, start: 252, end: 386, name: "Generation III" },
    { gen: 4, start: 387, end: 493, name: "Generation IV" },
    { gen: 5, start: 494, end: 649, name: "Generation V" },
    { gen: 6, start: 650, end: 721, name: "Generation VI" },
    { gen: 7, start: 722, end: 809, name: "Generation VII" },
    { gen: 8, start: 810, end: 905, name: "Generation VIII" },
  ];

  const getGeneration = (id: number) => {
    const gen = generationRanges.find((g) => id >= g.start && id <= g.end);
    return gen ? gen.gen : 1;
  };

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://pokeapi.co/api/v2/pokemon?limit=1025"
        );
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
                detail.sprites.versions?.["generation-v"]?.["black-white"]
                  ?.animated?.front_default || detail.sprites.front_default,
              height: detail.height,
              weight: detail.weight,
              generation: getGeneration(detail.id),
              isLegendary: legendaryPokemon.includes(detail.id),
            };
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

  const filteredPokemon = pokemon.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm);
    const matchesType = !selectedType || p.types.includes(selectedType);
    const matchesGeneration =
      !selectedGeneration || p.generation === selectedGeneration;
    const matchesLegendary = !showLegendaryOnly || p.isLegendary;
    return (
      matchesSearch && matchesType && matchesGeneration && matchesLegendary
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-2xl sm:text-4xl font-bold animate-pulse px-4">
            Loading Pokédex...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="bg-red-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center relative flex-shrink-0 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-800 rounded-full"></div>
                <div className="absolute w-3.5 h-3.5 bg-white rounded-full opacity-80 transform -translate-x-2 -translate-y-2"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                <div
                  className="w-4 h-4 bg-yellow-600 rounded-full border-2 border-white shadow-lg animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-4 h-4 bg-green-700 rounded-full border-2 border-white shadow-lg animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src="/pokedex_logo.png"
                alt="Pokedex Logo"
                className="h-16 lg:h-18 w-auto object-contain drop-shadow-xl"
              />
            </div>
            <div className="flex-shrink-0">
              <img
                src="/pball.png"
                alt="Pokeball"
                className="w-14 h-14 object-contain lg:w-16 lg:h-16 animate-spin"
                style={{ animationDuration: "20s" }}
              />
            </div>
          </div>
          <div className="relative max-w-4xl mx-auto">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search Pokémon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-red-800 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-xl transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sorting */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-white text-3xl font-bold mb-2">
            Select your Pokémon ({filteredPokemon.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game Generation Dropdown */}
          <div className="relative">
            <h3 className="text-orange-400 font-bold mb-3 text-lg">
              Game Generation
            </h3>
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
                        : "VIII"
                    }`
                  : "All"}
              </span>
              <svg
                className={`w-5 h-5 transition-transform ${
                  showGenDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
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
                    selectedGeneration === null
                      ? "bg-gray-700 text-white"
                      : "text-gray-300"
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
                      selectedGeneration === gen.gen
                        ? "bg-gray-700 text-white"
                        : "text-gray-300"
                    }`}
                  >
                    Generation{" "}
                    {gen.gen === 1
                      ? "I"
                      : gen.gen === 2
                      ? "II"
                      : gen.gen === 3
                      ? "III"
                      : gen.gen === 4
                      ? "IV"
                      : gen.gen === 5
                      ? "V"
                      : gen.gen === 6
                      ? "VI"
                      : gen.gen === 7
                      ? "VII"
                      : "VIII"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Pokemon Dropdown */}
          <div className="relative">
            <h3 className="text-orange-400 font-bold mb-3 text-lg">
              Sort Pokémon
            </h3>
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowGenDropdown(false);
              }}
              className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg flex items-center justify-between hover:border-gray-500 transition-all"
            >
              <span>{showLegendaryOnly ? "Legendary" : "Number"}</span>
              <svg
                className={`w-5 h-5 transition-transform ${
                  showSortDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
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
                    !showLegendaryOnly
                      ? "bg-gray-700 text-white"
                      : "text-gray-300"
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
                    showLegendaryOnly
                      ? "bg-gray-700 text-white"
                      : "text-gray-300"
                  }`}
                >
                  <FaCrown size={16} />
                  Legendary
                </button>
              </div>
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
              onClick={() =>
                setSelectedType(selectedType === type ? null : type)
              }
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
              <span
                className="font-bold text-xl ml-2"
                style={{ color: typeColors[selectedType] }}
              >
                {selectedType.toUpperCase()}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Pokemon Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="mb-6">
          <p className="text-gray-400 text-lg">
            Showing{" "}
            <span className="text-white font-bold">
              {filteredPokemon.length}
            </span>{" "}
            Pokémon
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPokemon.map((p) => (
            <div
              key={p.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700 hover:border-gray-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer group relative"
              onMouseEnter={() => setHoveredPokemon(p.id)}
              onMouseLeave={() => setHoveredPokemon(null)}
            >
              {p.isLegendary && (
                <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <FaCrown size={10} />
                  Legendary
                </div>
              )}
              <div className="relative bg-gray-700/50 rounded-xl p-4 mb-3">
                <img
                  src={hoveredPokemon === p.id ? p.animatedImage : p.image}
                  alt={p.name}
                  className="w-full h-32 object-contain group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded">
                  #{p.id.toString().padStart(3, "0")}
                </div>
              </div>
              <h3 className="text-white font-bold text-lg capitalize mb-2 text-center">
                {p.name}
              </h3>
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
            </div>
          ))}
        </div>
        {filteredPokemon.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-500 text-2xl mb-4">No Pokémon found</div>
            <p className="text-gray-600">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
