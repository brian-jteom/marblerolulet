
export interface Ball {
  id: string;
  name: string;
  color: string;
  y: number;
  x: number;
  velocity: { x: number; y: number };
  rank: number;
  isFinished: boolean;
  finishTime?: number;
}

export interface GameSettings {
  ballCount: number;
  mapId: string;
  courseLength: number;
  racerNames: string[];
  winCondition: 'first' | 'last';
  spinnerCount: number;
}

export interface CommentaryMessage {
  text: string;
  timestamp: number;
}
