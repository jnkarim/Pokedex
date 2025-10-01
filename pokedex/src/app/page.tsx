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
import { FaEye, FaSkullCrossbones } from "react-icons/fa";

interface Pokemon {
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
    speed: number;
    specialAttack: number;
    specialDefense: number;
  };
  description: string;
}

const Home: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

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

  // assign icons for each type
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
            {/* Left Side - Pokeball Button and Lights */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center relative flex-shrink-0 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-800 rounded-full"></div>
                <div className="absolute w-3.5 h-3.5 bg-white rounded-full opacity-80 transform -translate-x-2 -translate-y-2"></div>
              </div>
              
              <div className="flex gap-2 items-center">
                <div className="w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full border-2 border-white shadow-lg animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>

            {/* Center - Logo */}
            <div className="flex-shrink-0">
              <img
                src="/pokedex_logo.png"
                alt="Pokedex Logo"
                className="h-14 w-auto object-contain drop-shadow-xl"
              />
            </div>

            {/* Right Side - Pokeball */}
            <div className="animate-spin flex-shrink-0" style={{ animationDuration: '20s' }}>
              <img
                src="/pball.png"
                alt="Pokeball"
                className="w-14 h-14 object-contain"
              />
            </div>
          </div>

          {/* Search Bar */}
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
                  ? 'ring-4 ring-white scale-105' 
                  : selectedType 
                  ? 'opacity-40' 
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: typeColors[type],
              }}
            >
              <span className="text-xl">
                {typeIcons[type]}
              </span>
              <span className="capitalize text-sm">
                {type}
              </span>
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
    </div>
  );
};

export default Home;