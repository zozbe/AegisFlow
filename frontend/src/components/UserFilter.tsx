import { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

interface UserFilterProps {
  selectedUser: string;
  userList: string[];
  onSelectUser: (user: string) => void;
}

export default function UserFilter({ selectedUser, userList, onSelectUser }: UserFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-between gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-700/80 transition-colors min-w-[180px] shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">
            {selectedUser || 'Tüm Kullanıcılar'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-full min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => { onSelectUser(''); setIsDropdownOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              selectedUser === '' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${selectedUser === '' ? 'bg-blue-500' : 'bg-transparent'}`}></div>
            Tüm Kullanıcılar
          </button>
          
          {userList.map(user => (
            <button
              type="button"
              key={user}
              onClick={() => { onSelectUser(user); setIsDropdownOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                selectedUser === user ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${selectedUser === user ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
              {user}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}