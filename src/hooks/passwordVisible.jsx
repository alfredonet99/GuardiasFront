import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export function usePasswordToggle(value="") {
  const [visible, setVisible] = useState(false);

  useEffect(() => { if (!value) setVisible(false); }, [value]);

  const InputType = visible ? "text" : "password";
  const ToggleIcon = value ? (
    <span onClick={() => setVisible((v) => !v)} className="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
      {visible ? <FaEyeSlash /> : <FaEye />}
    </span>
  ) : null;

  return [InputType, ToggleIcon];
}
