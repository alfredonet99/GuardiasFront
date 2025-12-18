import { FiSearch } from "react-icons/fi";
import { useEffect, useState } from "react";

export default function SearchInputLong({ value, onChange, onDebouncedChange, delay = 500,  placeholder = "Buscar..." }) {
    const [internal, setInternal] = useState(value ?? "");
   
    useEffect(() => {
        setInternal(value ?? "");
    }, [value]);

    useEffect(() => {
        if (!onDebouncedChange) return;

        const id = setTimeout(() => {
        onDebouncedChange(internal);
        }, delay);

        return () => clearTimeout(id);
    }, [internal, delay, onDebouncedChange]);

    const handleChange = (e) => {
        setInternal(e.target.value);
        if (onChange) {
        onChange(e); 
        }
    };

    return (
        <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20}/>
            <input type="text" value={internal} onChange={handleChange} placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
        </div>
    );
}
