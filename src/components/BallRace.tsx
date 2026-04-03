
import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Ball, GameSettings } from '../types';
import UIOverlay from './UIOverlay';
import { getRaceCommentary } from '../services/geminiService';

const BALL_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4", "#f97316", "#8b5cf6", "#6366f1"];

interface Props {
  settings: GameSettings;
  onFinish: (finalRanks: Ball[]) => void;
}

const BallRace: React.FC<Props> = ({ settings, onFinish }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const ballsRef = useRef<(Matter.Body | null)[]>([]);
  const obstaclesRef = useRef<Matter.Body[]>([]);
  const scrollYRef = useRef(0);
  const zoomRef = useRef(1); 
  const [ballsState, setBallsState] = useState<Ball[]>([]);
  const [commentary, setCommentary] = useState<string>("레이스 시작! 우승 조건을 확인하세요!");
  const [isGameEnded, setIsGameEnded] = useState(false);
  const finishedIdsRef = useRef<Set<string>>(new Set());
  const finishSequenceRef = useRef<Ball[]>([]);

  const COURSE_WIDTH = 800;
  const MIN_GAP = 260; 
  const SEGMENT_HEIGHT = 15; 
  const TOTAL_SEGMENTS = Math.ceil(settings.courseLength / SEGMENT_HEIGHT);
  const COURSE_HEIGHT = TOTAL_SEGMENTS * SEGMENT_HEIGHT;
  const WIN_LINE_Y = COURSE_HEIGHT - 400;
  const ZOOM_TRIGGER_Y = (COURSE_HEIGHT * 2) / 3;

  const getWallOffsets = (segmentIndex: number) => {
    const y = segmentIndex * SEGMENT_HEIGHT;
    const prog = y / COURSE_HEIGHT;
    const baseFreq = 0.0018 + (prog * 0.001);
    
    let centerShift = Math.sin(y * baseFreq) * 260; 
    centerShift += Math.cos(y * 0.0008) * 100;
    centerShift += Math.sin(y * 0.005) * 20;

    let currentBaseGap = MIN_GAP + 60; 
    if (y > COURSE_HEIGHT * 0.7) currentBaseGap = MIN_GAP + 150;

    const leftBump = Math.sin(y * 0.08) * 15;
    const rightBump = -Math.cos(y * 0.07) * 15;

    let leftEdgeX = (COURSE_WIDTH / 2 + centerShift) - (currentBaseGap / 2) + leftBump;
    let rightEdgeX = (COURSE_WIDTH / 2 + centerShift) + (currentBaseGap / 2) + rightBump;

    const actualGap = rightEdgeX - leftEdgeX;
    if (actualGap < MIN_GAP) {
      const adjustment = (MIN_GAP - actualGap) / 2;
      leftEdgeX -= adjustment;
      rightEdgeX += adjustment;
    }

    const margin = 30;
    if (leftEdgeX < margin) {
        const diff = margin - leftEdgeX;
        leftEdgeX += diff;
        rightEdgeX += diff;
    }
    if (rightEdgeX > COURSE_WIDTH - margin) {
        const diff = rightEdgeX - (COURSE_WIDTH - margin);
        leftEdgeX -= diff;
        rightEdgeX -= diff;
    }

    return { 
      leftEdgeX, 
      rightEdgeX,
      gapCenter: (leftEdgeX + rightEdgeX) / 2 
    };
  };

  const handleManualStop = () => {
    if (isGameEnded) return;
    
    // 현재 들어온 순서 + 현재 달리고 있는 공들의 순위를 합쳐서 최종 순위 생성
    const currentRunners = [...ballsState];
    const finalResults = [...finishSequenceRef.current];
    
    currentRunners.forEach((ball, idx) => {
      finalResults.push({
        ...ball,
        rank: finishSequenceRef.current.length + idx + 1,
        isFinished: true,
        finishTime: performance.now()
      });
    });

    setIsGameEnded(true);
    onFinish(finalResults);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (ballsState.length > 0 && !isGameEnded) {
        const context = settings.winCondition === 'first' 
          ? "선두가 골을 향해 질주하고 있습니다!" 
          : "꼴찌가 역전의 기회를 노리며 버티고 있습니다!";
        const msg = await getRaceCommentary(ballsState, context);
        setCommentary(msg);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [isGameEnded, ballsState, settings.winCondition]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const engine = Matter.Engine.create();
    engineRef.current = engine;
    const world = engine.world;
    world.gravity.y = 1.4;

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: COURSE_WIDTH,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent',
        hasBounds: true
      }
    });

    const wallOptions = { 
      isStatic: true, 
      friction: 0.002, 
      restitution: 0.9, 
      render: { 
        fillStyle: '#1e293b',
        strokeStyle: '#334155',
        lineWidth: 1
      } 
    };
    const segments: Matter.Body[] = [];

    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      const offsets = getWallOffsets(i);
      const yPos = i * SEGMENT_HEIGHT;
      const radius = 380; 

      const leftBubble = Matter.Bodies.circle(offsets.leftEdgeX - radius, yPos, radius, { ...wallOptions });
      const rightBubble = Matter.Bodies.circle(offsets.rightEdgeX + radius, yPos, radius, { ...wallOptions });
      segments.push(leftBubble, rightBubble);
    }

    const dynamicObstacles: Matter.Body[] = [];
    if (settings.spinnerCount > 0) {
      const startOffset = 1500;
      const endOffset = WIN_LINE_Y - 500;
      const range = endOffset - startOffset;
      const spacing = range / (settings.spinnerCount + 1);

      for (let i = 1; i <= settings.spinnerCount; i++) {
        const yPos = startOffset + i * spacing;
        const segmentIdx = Math.floor(yPos / SEGMENT_HEIGHT);
        const offsets = getWallOffsets(segmentIdx);
        const jitterX = (Math.random() - 0.5) * 40;
        const bar = Matter.Bodies.rectangle(offsets.gapCenter + jitterX, yPos, 210, 27, {
          isStatic: true,
          render: { 
            fillStyle: '#a855f7', 
            strokeStyle: '#f0abfc', 
            lineWidth: 4,
            opacity: 0.9
          },
          restitution: 1.4,
          label: 'spinner'
        });
        Matter.Body.setAngle(bar, Math.random() * Math.PI);
        dynamicObstacles.push(bar);
      }
    }
    obstaclesRef.current = dynamicObstacles;

    segments.push(Matter.Bodies.rectangle(COURSE_WIDTH / 2, -50, COURSE_WIDTH, 100, wallOptions));
    segments.push(Matter.Bodies.rectangle(COURSE_WIDTH / 2, COURSE_HEIGHT + 50, COURSE_WIDTH, 100, { ...wallOptions, render: { fillStyle: '#ef4444' } }));

    Matter.World.add(world, [...segments, ...dynamicObstacles]);

    const balls: (Matter.Body | null)[] = [];
    for (let i = 0; i < settings.ballCount; i++) {
      const startX = COURSE_WIDTH / 2 + (i - (settings.ballCount - 1) / 2) * 35;
      const racerName = settings.racerNames[i] || `레이서 ${i + 1}`;
      const ball = Matter.Bodies.circle(startX, 100, 15, {
        restitution: 0.85,
        friction: 0.001,
        frictionAir: 0.002,
        render: { 
            fillStyle: BALL_COLORS[i % BALL_COLORS.length],
            strokeStyle: '#ffffff',
            lineWidth: 2
        },
        label: racerName
      });
      balls.push(ball);
    }
    ballsRef.current = balls;
    Matter.World.add(world, balls as Matter.Body[]);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    const startTime = performance.now();

    const updateCameraAndState = () => {
      if (!engineRef.current || !canvasRef.current || isGameEnded) return;

      obstaclesRef.current.forEach((obs, idx) => {
        if (obs.label === 'spinner') {
            const speed = (idx % 2 === 0 ? 0.045 : -0.045);
            Matter.Body.setAngle(obs, obs.angle + speed);
        }
      });

      let focusY = settings.winCondition === 'first' ? 0 : 999999;
      const currentBalls: Ball[] = [];

      ballsRef.current.forEach((b, i) => {
        if (!b) return;
        
        const bId = b.id.toString();
        const racerName = settings.racerNames[i] || `레이서 ${i + 1}`;
        const isFinished = b.position.y >= WIN_LINE_Y;

        if (isFinished && !finishedIdsRef.current.has(bId)) {
            finishedIdsRef.current.add(bId);
            finishSequenceRef.current.push({
                id: bId,
                name: racerName,
                color: BALL_COLORS[i % BALL_COLORS.length],
                x: b.position.x,
                y: b.position.y,
                velocity: { x: b.velocity.x, y: b.velocity.y },
                rank: finishSequenceRef.current.length + 1,
                isFinished: true,
                finishTime: performance.now() - startTime
            });
            Matter.World.remove(engineRef.current!.world, b);
            ballsRef.current[i] = null;

            if (finishSequenceRef.current.length === settings.ballCount) {
                setIsGameEnded(true);
                const finalResults = [...finishSequenceRef.current];
                if (settings.winCondition === 'last') {
                    finalResults.forEach((res, idx) => {
                        res.rank = settings.ballCount - idx;
                    });
                }
                onFinish(finalResults);
            }
            return;
        }

        if (!isFinished) {
            if (settings.winCondition === 'first') {
                if (b.position.y > focusY) focusY = b.position.y;
            } else {
                if (b.position.y < focusY) focusY = b.position.y;
            }

            currentBalls.push({
                id: bId,
                name: racerName,
                color: BALL_COLORS[i % BALL_COLORS.length],
                x: b.position.x,
                y: b.position.y,
                velocity: { x: b.velocity.x, y: b.velocity.y },
                rank: 0,
                isFinished: false
            });
        }
      });

      const rankedBalls = currentBalls.sort((a, b) => {
          return settings.winCondition === 'first' ? b.y - a.y : a.y - b.y;
      }).map((b, idx) => ({ ...b, rank: idx + 1 }));
      setBallsState(rankedBalls);

      const targetZoom = (settings.winCondition === 'first' && focusY > ZOOM_TRIGGER_Y) ? 0.67 : 1.0;
      zoomRef.current += (targetZoom - zoomRef.current) * 0.05; 

      const targetScroll = Math.max(0, focusY - (window.innerHeight * zoomRef.current) / 2);
      scrollYRef.current += (targetScroll - scrollYRef.current) * 0.1;
      
      const viewWidth = COURSE_WIDTH * zoomRef.current;
      const viewHeight = window.innerHeight * zoomRef.current;
      const offsetX = (viewWidth - COURSE_WIDTH) / 2;

      render.bounds.min.x = -offsetX;
      render.bounds.max.x = COURSE_WIDTH + offsetX;
      render.bounds.min.y = scrollYRef.current;
      render.bounds.max.y = scrollYRef.current + viewHeight;
      
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.clearRect(0, 0, COURSE_WIDTH, window.innerHeight);
        
        context.save();
        const scale = COURSE_WIDTH / (render.bounds.max.x - render.bounds.min.x);
        context.scale(scale, scale);
        context.translate(-render.bounds.min.x, -render.bounds.min.y);
        
        context.lineWidth = 1;
        for (let i = 0; i < TOTAL_SEGMENTS; i += 15) {
            const y = i * SEGMENT_HEIGHT;
            if (y < render.bounds.min.y - 100 || y > render.bounds.max.y + 100) continue;
            const off = getWallOffsets(i);
            context.beginPath();
            context.strokeStyle = 'rgba(168, 85, 247, 0.1)';
            context.moveTo(off.gapCenter - 150, y);
            context.lineTo(off.gapCenter + 150, y);
            context.stroke();
        }

        context.fillStyle = 'rgba(234, 179, 8, 0.2)';
        context.fillRect(-1000, WIN_LINE_Y, 3000, 200);
        context.strokeStyle = '#eab308';
        context.lineWidth = 15;
        context.beginPath();
        context.setLineDash([60, 30]);
        context.moveTo(-1000, WIN_LINE_Y);
        context.lineTo(2000, WIN_LINE_Y);
        context.stroke();
        context.setLineDash([]);
        context.font = "bold 110px Orbitron";
        context.fillStyle = "#eab308";
        context.textAlign = "center";
        context.fillText("FINISH", COURSE_WIDTH / 2, WIN_LINE_Y + 120);
        context.restore();

        Matter.Render.world(render);

        context.save();
        context.scale(scale, scale);
        context.translate(-render.bounds.min.x, -render.bounds.min.y);
        
        context.font = "bold 18px 'Noto Sans KR', sans-serif";
        context.textAlign = "center";
        context.textBaseline = "bottom";
        
        ballsRef.current.forEach((b) => {
          if (b) {
            const name = b.label;
            context.strokeStyle = "rgba(15, 23, 42, 0.9)";
            context.lineWidth = 4;
            context.strokeText(name, b.position.x, b.position.y - 25);
            context.fillStyle = "#ffffff";
            context.fillText(name, b.position.x, b.position.y - 25);
          }
        });
        context.restore();
      }

      requestAnimationFrame(updateCameraAndState);
    };

    updateCameraAndState();

    return () => {
      Matter.Engine.clear(engine);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
    };
  }, [settings, onFinish, isGameEnded]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900">
      <div className="relative shadow-[0_0_250px_rgba(0,0,0,0.8)] border-x-[15px] border-purple-500/10">
        <canvas ref={canvasRef} className="bg-slate-950" />
      </div>
      
      <UIOverlay 
        balls={ballsState} 
        commentary={commentary} 
        progress={scrollYRef.current / (COURSE_HEIGHT - window.innerHeight)} 
        winCondition={settings.winCondition}
        onStop={handleManualStop}
      />
    </div>
  );
};

export default BallRace;
