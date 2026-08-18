import React, { useState, useRef, useEffect } from "react";
import "./SearchableItemSelect.css";

export function SearchableItemSelect({
  label,
  value,
  onChange,
  items,
  placeholder = "Search items..."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItem = items.find((item) => item.id === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (itemId) => {
    onChange(itemId);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <label className="field searchable-item-select" ref={dropdownRef}>
      <span>{label}</span>
      <div className="searchable-select-container">
        <input
          type="text"
          className="searchable-select-input"
          placeholder={placeholder}
          value={isOpen ? searchTerm : selectedItem?.name || ""}
          onChange={(event) => setSearchTerm(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(!isOpen)}
          readOnly={!isOpen}
        />
        {isOpen && (
          <div className="searchable-select-dropdown">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`searchable-select-option ${
                    item.id === value ? "selected" : ""
                  }`}
                  onClick={() => handleSelect(item.id)}
                >
                  {item.name}
                </div>
              ))
            ) : (
              <div className="searchable-select-option disabled">
                No items found
              </div>
            )}
          </div>
        )}
      </div>
    </label>
  );
}
