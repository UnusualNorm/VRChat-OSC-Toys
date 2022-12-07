import {useState, useEffect} from 'react';
import { onStateChange } from './netcode';
import Plankette from './Plankette';

const Board = () => {
  const [plankettePosition, setPlankettePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    onStateChange((newState) => {
      setPlankettePosition(newState.plankettePosition);
    });
  }, []);

  return (
    <div className="board">
      <Plankette position={plankettePosition} />
    </div>
  );
}

export default Board;