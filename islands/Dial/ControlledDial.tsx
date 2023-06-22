import { MutableRef } from "preact/hooks";

import IconArrowBadgeUp from "tabler_icons_tsx/arrow-badge-up.tsx";
import IconArrowBadgeDown from "tabler_icons_tsx/arrow-badge-down.tsx";

interface ControlledDialProps {
  value: string;
  changeValue: (up: boolean) => void;
}

const ControlledDial = (
  { value, changeValue }: ControlledDialProps,
) => {
  return (
    <div className="flex flex-col items-center">
      <button
        className="btn btn-link"
        onClick={() => changeValue(true)}
      >
        <IconArrowBadgeUp />
      </button>
      <div className="font-bold">{value}</div>
      <button
        className="btn btn-link"
        onClick={() => changeValue(false)}
      >
        <IconArrowBadgeDown />
      </button>
    </div>
  );
};

export default ControlledDial;
