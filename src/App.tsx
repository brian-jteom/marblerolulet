
import React, { useState, useCallback, useEffect } from 'react';
import BallRace from './components/BallRace';
import { GameSettings, Ball } from './types';

const DEFAULT_NAMES = ["불꽃슛", "번개탄", "얼음땡", "질풍노도", "중력붕괴", "빛의속도", "그림자", "폭풍우", "대지진", "성난황소"];
const BALL_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4", "#f97316", "#8b5cf6", "#6366f1"];

const INITIAL_SETTINGS: GameSettings = {
  ballCount: 5,
  mapId: 'map1',
  courseLength: 12000,
  racerNames: DEFAULT_NAMES.slice(0, 5),
  winCondition: 'first',
  spinnerCount: 8,
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'lobby' | 'racing' | 'finished'>('lobby');
  const [settings, setSettings] = useState<GameSettings>(INITIAL_SETTINGS);
  const [results, setResults] = useState<Ball[]>([]);

  useEffect(() => {
    setSettings(prev => {
      const newNames = [...prev.racerNames];
      if (newNames.length < prev.ballCount) {
        for (let i = newNames.length; i < prev.ballCount; i++) {
          newNames.push(DEFAULT_NAMES[i % DEFAULT_NAMES.length]);
        }
      } else if (newNames.length > prev.ballCount) {
        newNames.splice(prev.ballCount);
      }
      return { ...prev, racerNames: newNames };
    });
  }, [settings.ballCount]);

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...settings.racerNames];
    newNames[index] = name;
    setSettings({ ...settings, racerNames: newNames });
  };

  const handleStartRace = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setGameState('racing');
  };

  const handleRaceFinish = useCallback((finalRanks: Ball[]) => {
    setResults(finalRanks);
    setGameState('finished');
  }, []);

  const handleRestart = () => {
    setGameState('lobby');
    setResults([]);
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {gameState === 'lobby' && (
        <div className="z-10 bg-slate-900/80 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-xl shadow-2xl max-w-lg w-full animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
          <h1 className="text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6 text-center shrink-0">
            GRAVITY DASH
          </h1>
          
          <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
            <div>
              <label className="block text-cyan-200 text-sm mb-3 font-bold uppercase tracking-wider">우승 조건 설정</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSettings({...settings, winCondition: 'first'})}
                  className={`py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${
                    settings.winCondition === 'first'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  🥇 선착순 우승<br/><span className="text-[10px] font-normal opacity-70">먼저 도착하면 1등</span>
                </button>
                <button
                  onClick={() => setSettings({...settings, winCondition: 'last'})}
                  className={`py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${
                    settings.winCondition === 'last'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  🐢 꼴찌가 우승<br/><span className="text-[10px] font-normal opacity-70">마지막에 남으면 1등</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-cyan-200 text-sm mb-2 font-bold uppercase tracking-wider">레이서 인원 ({settings.ballCount}명)</label>
              <input 
                type="range" min="2" max="10" step="1"
                value={settings.ballCount}
                onChange={(e) => setSettings({...settings, ballCount: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div>
              <label className="block text-purple-300 text-sm mb-2 font-bold uppercase tracking-wider flex justify-between">
                <span>회전 장애물 개수</span>
                <span className="text-cyan-400 font-mono">{settings.spinnerCount}개</span>
              </label>
              <input 
                type="range" min="0" max="30" step="1"
                value={settings.spinnerCount}
                onChange={(e) => setSettings({...settings, spinnerCount: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div>
              <label className="block text-cyan-200 text-sm mb-3 font-bold uppercase tracking-wider">레이서 이름 설정</label>
              <div className="grid grid-cols-1 gap-3">
                {settings.racerNames.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: BALL_COLORS[idx] }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(idx, e.target.value)}
                      placeholder={`레이서 ${idx + 1}`}
                      className="bg-transparent text-slate-100 text-sm font-bold outline-none w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleStartRace(settings)}
            className="w-full mt-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-purple-500/20 shrink-0"
          >
            경기 시작
          </button>
        </div>
      )}

      {gameState === 'racing' && (
        <BallRace 
          settings={settings} 
          onFinish={handleRaceFinish} 
        />
      )}

      {gameState === 'finished' && (
        <div className="z-10 bg-slate-900/90 p-8 rounded-3xl border-2 border-yellow-500/50 backdrop-blur-2xl shadow-[0_0_50px_rgba(234,179,8,0.3)] max-w-lg w-full">
          <h2 className="text-3xl font-orbitron font-bold text-yellow-400 mb-2 text-center italic tracking-tighter">FINAL RANKING</h2>
          <p className="text-center text-slate-400 text-[10px] mb-6 uppercase tracking-[0.2em] font-bold border-b border-slate-800 pb-4">
            {settings.winCondition === 'first' ? 'Speed Race Mode' : 'Endurance Mode'}
          </p>
          <div className="space-y-4 mb-8 h-80 overflow-y-auto pr-2 custom-scrollbar">
            {results.sort((a,b) => a.rank - b.rank).map((ball) => (
              <div key={ball.id} className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 transition-all hover:bg-slate-800/60">
                <span className={`text-2xl font-orbitron font-bold w-16 ${ball.rank === 1 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-slate-400'}`}>
                  {ball.rank}번째
                </span>
                <div className="w-5 h-5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: ball.color }} />
                <span className="text-xl font-bold text-slate-100 tracking-tight">{ball.name}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleRestart}
            className="w-full py-5 bg-gradient-to-b from-slate-100 to-slate-300 text-slate-900 rounded-2xl font-bold text-xl hover:brightness-110 transition-all shadow-lg active:scale-95"
          >
            메인으로 돌아가기
          </button>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  );
};

export default App;
