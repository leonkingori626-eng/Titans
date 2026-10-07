/**
 * PROJECT: AETHER - Tactical Loadout Customizer
 * Allows players to assemble customized armaments without rigid class locks.
 */
import React, { useState } from 'react';
import { PlayerLoadout, SquadRole, WeaponDef, GadgetDef, AbilityDef } from '../types/game';
import { WEAPONS_PRIMARY, WEAPONS_SECONDARY, GADGETS_SLOT1, GADGETS_SLOT2, ABILITIES } from '../game/constants';
import { Crosshair, Shield, Zap, Sparkles, Check, ChevronRight, Award, Flame } from 'lucide-react';

interface LoadoutBuilderProps {
  currentLoadout: PlayerLoadout;
  onSaveLoadout: (loadout: PlayerLoadout) => void;
  onClose: () => void;
}

export const LoadoutBuilder: React.FC<LoadoutBuilderProps> = ({ currentLoadout, onSaveLoadout, onClose }) => {
  const [loadout, setLoadout] = useState<PlayerLoadout>({ ...currentLoadout });
  const [activeTab, setActiveTab] = useState<'primary' | 'secondary' | 'gadget1' | 'gadget2' | 'ability' | 'role'>('primary');

  const selectedPrimary = WEAPONS_PRIMARY.find((w) => w.id === loadout.primaryWeaponId) || WEAPONS_PRIMARY[0];
  const selectedSecondary = WEAPONS_SECONDARY.find((w) => w.id === loadout.secondaryWeaponId) || WEAPONS_SECONDARY[0];
  const selectedGadget1 = GADGETS_SLOT1.find((g) => g.id === loadout.gadget1Id) || GADGETS_SLOT1[0];
  const selectedGadget2 = GADGETS_SLOT2.find((g) => g.id === loadout.gadget2Id) || GADGETS_SLOT2[0];
  const selectedAbility = ABILITIES.find((a) => a.id === loadout.abilityId) || ABILITIES[0];

  const handleSave = () => {
    onSaveLoadout(loadout);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-6 bg-cyan-500 rounded-xs"></div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 tracking-wider">ARSENAL SPECIFICATION & LOADOUT</h2>
              <p className="text-xs text-neutral-400">Tactical configuration • Unrestricted role loadout</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> CONFIRM LOADOUT
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/20 overflow-x-auto text-xs">
          {[
            { id: 'primary', label: 'PRIMARY WEAPON', current: selectedPrimary.name },
            { id: 'secondary', label: 'SECONDARY WEAPON', current: selectedSecondary.name },
            { id: 'gadget1', label: 'TACTICAL GADGET 1', current: selectedGadget1.name },
            { id: 'gadget2', label: 'DEFENSE GADGET 2', current: selectedGadget2.name },
            { id: 'ability', label: 'AETHER ABILITY', current: selectedAbility.name },
            { id: 'role', label: 'SQUAD FUNCTION', current: loadout.role },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 flex flex-col items-start border-b-2 transition whitespace-nowrap min-w-[140px] ${
                activeTab === tab.id
                  ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span className="text-[10px] tracking-widest text-neutral-500 uppercase">{tab.label}</span>
              <span className="font-semibold text-xs truncate max-w-[130px]">{tab.current}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Item Selector List */}
          <div className="flex flex-col gap-3">
            {activeTab === 'primary' &&
              WEAPONS_PRIMARY.map((w) => (
                <div
                  key={w.id}
                  onClick={() => setLoadout({ ...loadout, primaryWeaponId: w.id })}
                  className={`p-3.5 rounded border cursor-pointer transition ${
                    loadout.primaryWeaponId === w.id
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(0,210,255,0.15)]'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-100">{w.name}</span>
                    <span className="text-[10px] uppercase text-cyan-400 px-2 py-0.5 bg-cyan-950/50 rounded">
                      {w.type}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{w.description}</p>
                </div>
              ))}

            {activeTab === 'secondary' &&
              WEAPONS_SECONDARY.map((w) => (
                <div
                  key={w.id}
                  onClick={() => setLoadout({ ...loadout, secondaryWeaponId: w.id })}
                  className={`p-3.5 rounded border cursor-pointer transition ${
                    loadout.secondaryWeaponId === w.id
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(0,210,255,0.15)]'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-100">{w.name}</span>
                    <span className="text-[10px] uppercase text-cyan-400 px-2 py-0.5 bg-cyan-950/50 rounded">
                      {w.type}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{w.description}</p>
                </div>
              ))}

            {activeTab === 'gadget1' &&
              GADGETS_SLOT1.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setLoadout({ ...loadout, gadget1Id: g.id })}
                  className={`p-3.5 rounded border cursor-pointer transition ${
                    loadout.gadget1Id === g.id
                      ? 'border-cyan-400 bg-cyan-950/30'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-100">{g.name}</span>
                    <span className="text-[10px] text-neutral-400">CD: {g.cooldown}s</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{g.description}</p>
                </div>
              ))}

            {activeTab === 'gadget2' &&
              GADGETS_SLOT2.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setLoadout({ ...loadout, gadget2Id: g.id })}
                  className={`p-3.5 rounded border cursor-pointer transition ${
                    loadout.gadget2Id === g.id
                      ? 'border-cyan-400 bg-cyan-950/30'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-100">{g.name}</span>
                    <span className="text-[10px] text-neutral-400">CD: {g.cooldown}s</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{g.description}</p>
                </div>
              ))}

            {activeTab === 'ability' &&
              ABILITIES.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setLoadout({ ...loadout, abilityId: a.id })}
                  className={`p-3.5 rounded border cursor-pointer transition ${
                    loadout.abilityId === a.id
                      ? 'border-cyan-400 bg-cyan-950/30'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-100">{a.name}</span>
                    <span className="text-[10px] text-teal-400">CD: {a.cooldown}s</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{a.description}</p>
                </div>
              ))}

            {activeTab === 'role' &&
              (['LEADER', 'SCOUT', 'ASSAULT', 'SUPPORT'] as SquadRole[]).map((role) => (
                <div
                  key={role}
                  onClick={() => setLoadout({ ...loadout, role })}
                  className={`p-3.5 rounded border cursor-pointer transition ${
                    loadout.role === role
                      ? 'border-cyan-400 bg-cyan-950/30'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-100">{role}</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {role === 'LEADER' && 'Coordinates tactical pushes and dropship air extractions.'}
                    {role === 'SCOUT' && 'Specialized in ODM high-velocity wire infiltration and reconnaissance.'}
                    {role === 'ASSAULT' && 'Spearheads frontal breaches into enemy core containment.'}
                    {role === 'SUPPORT' && 'Supplies ballistic barriers, med-stims, and rapid neural recalls.'}
                  </p>
                </div>
              ))}
          </div>

          {/* Telemetry / Weapon Stats Preview Panel */}
          <div className="p-5 rounded border border-neutral-800 bg-black/60 flex flex-col justify-between">
            <div>
              <div className="text-xs text-neutral-500 uppercase tracking-widest mb-1">SELECTED CONFIGURATION</div>
              <h3 className="text-xl font-bold text-neutral-100 mb-4">{selectedPrimary.name}</h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>DAMAGE PER SHOT</span>
                    <span className="font-bold text-cyan-400">{selectedPrimary.damage}</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded overflow-hidden">
                    <div className="bg-cyan-400 h-full" style={{ width: `${(selectedPrimary.damage / 110) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>FIRE VELOCITY</span>
                    <span className="font-bold text-cyan-400">{selectedPrimary.fireRate} rps</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded overflow-hidden">
                    <div className="bg-cyan-400 h-full" style={{ width: `${(selectedPrimary.fireRate / 20) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>EFFECTIVE RANGE</span>
                    <span className="font-bold text-cyan-400">{selectedPrimary.range}m</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded overflow-hidden">
                    <div className="bg-cyan-400 h-full" style={{ width: `${(selectedPrimary.range / 220) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>MAGAZINE CAPACITY</span>
                    <span className="font-bold text-cyan-400">{selectedPrimary.magSize} rds</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded overflow-hidden">
                    <div className="bg-cyan-400 h-full" style={{ width: `${(selectedPrimary.magSize / 45) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800 text-xs text-neutral-400">
              <span className="text-cyan-400 font-bold">ODM WIRE GEAR: </span>
              Standard twin hip-mounted winches included across all loadouts for grappling structures & titans.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
