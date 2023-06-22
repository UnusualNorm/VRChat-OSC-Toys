import { type MutableRef, useEffect, useState } from "preact/hooks";

import ControlledDial from "./ControlledDial.tsx";

interface DialProps {
  values: string[];
  invert?: boolean;
  valueI?: number;
  valueRef?: MutableRef<string>;
  valueIRef?: MutableRef<number>;
  onChange?: (value: string) => void;
}

const Dial = (
  { values, invert = true, valueI, valueRef, valueIRef, onChange }: DialProps,
) => {
  const [index, setIndex] = useState(valueI ?? 0);

  useEffect(() => {
    if (index === valueI) {
      return;
    }

    if (!valueI) {
      setIndex(0);
      return;
    }

    setIndex(valueI);
  }, [valueI]);

  useEffect(() => {
    if (!valueRef) return;
    if (valueRef.current === values[index]) return;

    valueRef.current = values[index];
  }, [index]);

  useEffect(() => {
    if (!valueIRef) return;
    if (valueIRef.current === index) return;

    valueIRef.current = index;
  }, [index]);

  const changeValue = (up: boolean) => {
    // It feels more natural to invert up and down
    let nextIndex = up ? index - Number(invert) : index + Number(invert);

    if (nextIndex < 0) {
      nextIndex = values.length - 1;
    } else if (nextIndex >= values.length) {
      nextIndex = 0;
    }

    const nextValue = values[nextIndex];
    setIndex(nextIndex);
    onChange?.(nextValue);
  };

  return (
    <ControlledDial
      value={values[index]}
      changeValue={changeValue}
    />
  );
};

export default Dial;
