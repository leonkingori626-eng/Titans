/**
 * PROJECT: AETHER - Planetary Faction War Map
 * Visualizes global territorial control between The Aegis and The Vanguard.
 * Match victories dynamically shift planetary control of Aether energy conduits.
 */
import React from 'react';
import { FactionId } from '../types/game';
import { FACTIONS_LORE } from '../game/constants';
import { Globe, Shield, Flame, Radio, Zap, MapPin, ChevronRight } from 'lucide-react';

interface FactionWarMapProps {
  playerFaction: FactionId;
  userRankRating: number;
  onDeployOperation: (mode: any) => void;
  onClose: () => void;
}

export const FactionWarMap: React.FC<FactionWarMapProps> = ({
  playerFaction,
  userRankRating,
  onDeployOperation,
  onClose,
}) => {
  const aegisPercent = 54;
  const vanguardPercent = 46;

  const sectors = [
    {
      id: 'sec_01',
      name: 'SECTOR 01: NEW BASTION KEEP',
      status: 'AEGIS CONTROLLED (82%)',
      controller: 'AEGIS',
      energyOutput: '9.4 TW',
      risk: 'HEAVILY FORTIFIED',
      desc: 'Central fortress and Aether regulator city held by the Aegis Grand Military Council.',
    },
    {
      id: 'sec_02',
      name: 'SECTOR 02: TITAN TRENCH & CRATER',
      status: 'CONTESTED ZONE (50/50)',
      controller: 'CONTESTED',
      energyOutput: '14.8 TW',
      risk: 'EXTREME • PROTO-TITAN PATROL',
      desc: 'The ground zero of The Collapse where rogue biomechanical Titans roam surviving reactors.',
    },
    {
      id: 'sec_03',
      name: 'SECTOR 03: FOUNDRY UNDERBELLY',
      status: 'VANGUARD SECURED (78%)',
      controller: 'VANGUARD',
      energyOutput: '7.2 TW',
      risk: 'GUERRILLA RESISTANCE',
      desc: 'Industrial smelting labyrinth used by Vanguard militia to fabricate modular armor and weapons.',
    },
    {
      id: 'sec_04',
      name: 'SECTOR 04: OBSIDIAN HELIPAD LZ',
      status: 'EXTRACTION CORRIDOR',
      controller: 'CONTESTED',
      energyOutput: '4.1 TW',
      risk: 'AIRSPACE LOCKDOWN',
      desc: 'High-altitude extraction aerodrome capable of launching VTOL Dropships for core recovery.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-5xl bg-neutral-950 border border-neutral-800 rounded-md shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-neutral-100 tracking-wider">
                PLANETARY FACTION WAR • STRATEGIC THEATER
              </h2>
              <p className="text-xs text-neutral-400">Post-Collapse Earth • Global Aether Grid Stabilization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition uppercase tracking-wider"
          >
            DISMISS MAP
          </button>
        </div>

        {/* Global War Balance Meter */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-black/60 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="flex items-center gap-2 text-cyan-400">
              <Shield className="w-4 h-4" /> THE AEGIS ({aegisPercent}%)
            </span>
            <span className="text-neutral-500 uppercase tracking-widest text-[10px]">
              GLOBAL TERRITORIAL CONTROL
            </span>
            <span className="flex items-center gap-2 text-orange-400">
              THE VANGUARD ({vanguardPercent}%) <Flame className="w-4 h-4" />
            </span>
          </div>

          <div className="w-full h-3 rounded-full overflow-hidden flex bg-neutral-900 border border-neutral-800">
            <div className="bg-cyan-500 h-full transition-all" style={{ width: `${aegisPercent}%` }}></div>
            <div className="bg-orange-500 h-full transition-all" style={{ width: `${vanguardPercent}%` }}></div>
          </div>
        </div>

        {/* Interactive Map Sectors Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectors.map((sec) => (
            <div
              key={sec.id}
              className={`p-4 rounded border transition flex flex-col justify-between ${
                sec.controller === 'AEGIS'
                  ? 'border-cyan-500/40 bg-cyan-950/20'
                  : sec.controller === 'VANGUARD'
                  ? 'border-orange-500/40 bg-orange-950/20'
                  : 'border-yellow-500/40 bg-yellow-950/10'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={`w-4 h-4 ${
                        sec.controller === 'AEGIS'
                          ? 'text-cyan-400'
                          : sec.controller === 'VANGUARD'
                          ? 'text-orange-400'
                          : 'text-yellow-400'
                      }`}
                    />
                    <h3 className="font-bold text-sm text-neutral-100">{sec.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      sec.controller === 'AEGIS'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : sec.controller === 'VANGUARD'
                        ? 'bg-orange-950 text-orange-300 border border-orange-800'
                        : 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                    }`}
                  >
                    {sec.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mb-3">{sec.desc}</p>
                <div className="text-[11px] text-neutral-500 flex gap-4">
                  <span>ENERGY: {sec.energyOutput}</span>
                  <span>THREAT: {sec.risk}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-end">
                <button
                  onClick={() => {
                    onDeployOperation('CORE_EXTRACTION');
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 rounded flex items-center gap-1.5 transition"
                >
                  DEPLOY TO SECTOR <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
