import React, { useState } from "react";

const EMOJI_GROUPS = {
  People: ["👌", "🧠", "🧑", "👨", "👩", "👧", "👦", "👶", "👨‍🦰", "👩‍🦰", "👨‍🦱", "👩‍🦱", "👨‍🦳", "👩‍🦳", "👨‍🦲", "👩‍🦲", "👨‍💻", "👩‍💻", "👨‍🔬", "👩‍🔬", "👨‍🚀", "👩‍🚀", "👨‍✈️", "👩‍✈️", "👨‍🚒", "👩‍🚒"],
  Animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🦄", "🐝", "🦋", "🐢", "🐍", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐠", "🐟", "🐬"],
  Food: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🥦", "🥬", "🥒", "🧄", "🧅", "🥜", "🌰", "🍞", "🥐"],
  Activities: ["🎓", "🎨", "🖌️", "🖍️", "🎤", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻", "🎮", "🕹️", "🏀", "🏈", "⚽", "🎾", "🏐", "🏓", "🏸", "🥊", "🥋", "⛸️", "🛼", "🛹", "🏹", "🎣", "🎯"],
  Travel: ["🌏", "✈️", "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🚲", "🛵", "🏍️", "🚂", "🚆", "🚊", "🚉", "🚢", "🛳️", "⛴️", "🚤", "🛶", "🚁", "🛸"],
  Objects: ["🌈", "✨", "📚", "💡", "🔍", "📝", "📖", "📌", "📍", "📎", "📏", "📐", "📊", "📈", "📉", "📄", "📑", "📒", "📔", "📕", "📗", "📘", "📙", "📓", "📰", "🗞️", "📜", "🗂️", "📂", "📁", "🗄️", "🗑️"],
  Flags: ["🏳️", "🏴", "🏴‍☠️", "🏁", "🚩", "🏳️‍🌈", "🇻🇳", "🇺🇸", "🇬🇧", "🇯🇵", "🇰🇷", "🇨🇳", "🇩🇪", "🇫🇷", "🇮🇹", "🇪🇸", "🇵🇹", "🇳🇱", "🇧🇪", "🇱🇺", "🇨🇭", "🇦🇹", "🇨🇿", "🇸🇰", "🇵🇱", "🇭🇺", "🇷🇴", "🇧🇬", "🇬🇷"]
};

interface IconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ selected, onSelect }) => {
  const [customIcon, setCustomIcon] = useState("");
  const [activeGroup, setActiveGroup] = useState<keyof typeof EMOJI_GROUPS>("People");

  const handleCustomIcon = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomIcon(e.target.value);
    onSelect(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-bold">{selected}</div>
      
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.keys(EMOJI_GROUPS).map(group => (
          <button
            key={group}
            onClick={() => setActiveGroup(group as keyof typeof EMOJI_GROUPS)}
            className={`px-3 py-1 rounded-full text-sm ${
              activeGroup === group 
                ? "bg-red-600 text-white" 
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg shadow-sm">
        {EMOJI_GROUPS[activeGroup].map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className={`p-2 rounded text-xl ${
              selected === emoji 
                ? "bg-red-600 font-bold ring-2 ring-red-600" 
                : "hover:bg-red-400"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customIcon}
          onChange={handleCustomIcon}
          placeholder="Nhập emoji tùy chỉnh"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {customIcon && (
          <div className="text-xl">
            {customIcon}
          </div>
        )}
      </div>
    </div>
  );
};

export { IconPicker };