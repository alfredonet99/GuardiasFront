import { FiTerminal } from "react-icons/fi";

export default function IconConsole({ label }) {
  return (
    <div className="flex items-center gap-3 h-8">
      <FiTerminal className="text-xl flex-shrink-0" />
      <span className={`transition-all duration-300 ease-in-out origin-left whitespace-nowrap ${ label ? 'opacity-100 scale-100' : 'opacity-0 scale-100' }`}>
        {label}
      </span>
    </div>
  );
}
