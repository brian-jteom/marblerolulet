
import React from 'react';
import { Ball } from '../types';
import { Trophy, Radio, Activity, Target, StopCircle } from 'lucide-react';

interface Props {
  balls: Ball[];
  commentary: string;
  progress: number;
  winCondition?: 'first' | 'last';
  onStop?: () => void;
}

const UIOverlay: React.FC<Props> = ({ balls, commentary, progress, winCondition = 'first', onStop }) => {
  const topBalls = balls.slice(0, 5);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col p-6">
      {/* Top Bar: Progress & Commentary */}
      <div className="flex justify-between items-start gap-4">
        <div className="w-64 bg-slate-900/80 p-4 rounded-xl border border-cyan-500/30 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2 mb-3 text-cyan-400">
            <Radio size={18} className="animate-pulse" />
            <span className="font-orbitron text-sm font-bold tracking-tight">AI LIVE COMMENTARY</span>
          </div>
          <p className="text-slate-100 text-sm leading-relaxed italic">
            "{commentary}"
          </p>
        </div>

        <div className="flex-1 max-w-xl flex flex-col items-center mt-2">
           <div className="flex items-center gap-2 mb-2 bg-slate-900/60 px-4 py-1 rounded-full border border-slate-700 backdrop-blur-sm">
             <Target size={14} className={winCondition === 'first' ? 'text-cyan-400' : 'text-purple-400'} />
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
               Mode: {winCondition === 'first' ? 'First to Finish Wins' : 'Last One Wins'}
             </span>
           </div>
           <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
                className={`h-full bg-gradient-to-r transition-all duration-300 ${winCondition === 'first' ? 'from-cyan-500 to-purple-500' : 'from-purple-500 to-cyan-500'}`} 
                style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        </div>

        <div className="w-64 bg-slate-900/80 p-4 rounded-xl border border-yellow-500/30 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2 mb-3 text-yellow-400">
            <Trophy size={18} />
            <span className="font-orbitron text-sm font-bold tracking-tight">리더보드</span>
          </div>
          <div className="space-y-2">
            {topBalls.map((ball, idx) => (
              <div key={ball.id} className="flex items-center gap-2">
                <span className="text-slate-500 text-xs font-bold w-12">{idx + 1}번째</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ball.color }} />
                <span className="text-slate-200 text-xs font-bold truncate flex-1">{ball.name}</span>
                <span className="text-cyan-400 text-[10px] font-mono">{Math.round(ball.y)}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Bottom: Manual Stop Button */}
      <div className="mt-auto mb-4 flex justify-center">
        <button 
          onClick={onStop}
          className="pointer-events-auto flex items-center gap-2 px-8 py-4 bg-red-600/20 hover:bg-red-600/40 text-red-400 border-2 border-red-500/50 rounded-2xl font-bold text-lg backdrop-blur-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
        >
          <StopCircle size={24} />
          중단 및 현재 순위 확인
        </button>
      </div>

      {/* Bottom Right: Stats */}
      <div className="self-end">
        <div className="bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700 backdrop-blur-md flex items-center gap-3">
          <Activity size={16} className="text-green-400" />
          <span className="text-slate-400 text-xs font-mono uppercase">Simulation_Active // {winCondition}_WIN</span>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
