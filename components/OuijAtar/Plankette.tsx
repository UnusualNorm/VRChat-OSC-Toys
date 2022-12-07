import { useState, useEffect, DragEvent } from 'react';
import { syncPosition, onPositionChange, takeFocus, onFocusChange } from './netcode';
import styles from '../../styles/OuijAtar/Plankette.module.css';
import Image from 'next/image';

function Plankette() {
  const [plankettePosition, setPlankettePosition] = useState([ 0, 0 ]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    onPositionChange((newPosition) => 
      setPlankettePosition(newPosition));
    onFocusChange((focuser, isSelf) => setFocused(isSelf));
  }, []);

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    const newPosition: [number, number] = [
      event.clientX,
      event.clientY
    ];
    setPlankettePosition(newPosition);
    syncPosition(newPosition);
  };

  return (
    <Image
      className={styles.plankette}
      style={{
        left: plankettePosition[0],
        top: plankettePosition[1]
      }}
      src={focused ? '' : ''}
      onMouseDown={takeFocus}
      onDrag={handleDrag}
    />
  );
}

export default Plankette;