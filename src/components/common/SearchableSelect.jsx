/*
=========================================================
ATTENDX - REUSABLE SEARCHABLE SELECT COMPONENT
=========================================================
Mobile-first, accessible, searchable dropdown with:
- Live search filtering
- Custom option addition ("+ Add Custom ...")
- Multi-select support with removable chips
- Click-outside dismiss
=========================================================
*/

import React, { useState, useRef, useEffect } from "react";

export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option...",
  allowCustom = false,
  customLabel = "Add Custom Option",
  onAddCustom,
  isMulti = false,
  disabled = false,
  emptyMessage = "No matching options found."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  // Normalize options to [{ value, label, sublabel }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return {
      value: opt.value ?? opt.code ?? opt.id ?? opt.name,
      label: opt.label ?? opt.name ?? opt.code ?? opt.value,
      sublabel: opt.sublabel ?? (opt.code && opt.name ? opt.name : null)
    };
  });

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const lMatch = opt.label && opt.label.toLowerCase().includes(q);
    const vMatch = opt.value && String(opt.value).toLowerCase().includes(q);
    const sMatch = opt.sublabel && opt.sublabel.toLowerCase().includes(q);
    return lMatch || vMatch || sMatch;
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = (optVal) => {
    if (isMulti) {
      const currentList = Array.isArray(value) ? value : [];
      if (currentList.includes(optVal)) {
        onChange(currentList.filter((v) => v !== optVal));
      } else {
        onChange([...currentList, optVal]);
      }
    } else {
      onChange(optVal);
      setIsOpen(false);
      setSearch("");
    }
  };

  const handleRemoveChip = (e, valToRemove) => {
    e.stopPropagation();
    if (isMulti && Array.isArray(value)) {
      onChange(value.filter((v) => v !== valToRemove));
    }
  };

  const handleCustomAdd = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    if (onAddCustom) {
      onAddCustom(trimmed);
    } else {
      handleSelect(trimmed);
    }
    setSearch("");
    setIsOpen(false);
  };

  // Selected label display for single select
  const selectedObj = !isMulti ? normalizedOptions.find((o) => o.value === value) : null;
  const displayLabel = selectedObj ? selectedObj.label : value;

  const exactMatchExists = normalizedOptions.some(
    (o) => o.label.toLowerCase() === search.trim().toLowerCase() || String(o.value).toLowerCase() === search.trim().toLowerCase()
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto"
      }}
    >
      {/* Control Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          minHeight: 40,
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 6,
          background: "#fff",
          border: isOpen ? "1.5px solid var(--attendx-navy, #0F172A)" : "1px solid var(--attendx-border, #CBD5E1)",
          borderRadius: "var(--radius-md, 8px)",
          cursor: "pointer",
          userSelect: "none",
          fontSize: 13,
          color: "var(--attendx-text-primary, #0F172A)",
          transition: "border-color 0.15s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, flex: 1, minWidth: 0 }}>
          {isMulti && Array.isArray(value) && value.length > 0 ? (
            value.map((val) => {
              const opt = normalizedOptions.find((o) => o.value === val);
              const chipLabel = opt ? opt.label : val;
              return (
                <span
                  key={val}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    background: "rgba(15, 23, 42, 0.08)",
                    border: "1px solid rgba(15, 23, 42, 0.15)",
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--attendx-navy, #0F172A)"
                  }}
                >
                  <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chipLabel}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveChip(e, val)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontSize: 12,
                      lineHeight: 1,
                      color: "inherit"
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            })
          ) : !isMulti && value ? (
            <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayLabel}
            </span>
          ) : (
            <span style={{ color: "var(--attendx-text-muted, #64748B)" }}>{placeholder}</span>
          )}
        </div>

        {/* Dropdown chevron */}
        <span style={{ fontSize: 10, color: "var(--attendx-text-muted, #64748B)", marginLeft: 6 }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 1050,
            background: "#ffffff",
            border: "1px solid var(--attendx-border, #CBD5E1)",
            borderRadius: "var(--radius-md, 8px)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            maxHeight: 250,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Box */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--attendx-border, #E2E8F0)", background: "#F8FAFC" }}>
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter..."
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--attendx-border, #CBD5E1)",
                outline: "none"
              }}
            />
          </div>

          {/* Options List */}
          <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = isMulti
                  ? Array.isArray(value) && value.includes(opt.value)
                  : value === opt.value;

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      padding: "8px 12px",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: isSelected ? "rgba(15, 23, 42, 0.06)" : "transparent",
                      color: isSelected ? "var(--attendx-navy, #0F172A)" : "var(--attendx-text-primary, #1E293B)",
                      fontWeight: isSelected ? 600 : 400,
                      transition: "background 0.1s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#F1F5F9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{opt.label}</span>
                      {opt.sublabel && opt.sublabel !== opt.label && (
                        <span style={{ fontSize: 10, color: "var(--attendx-text-muted, #64748B)" }}>
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <span style={{ color: "var(--attendx-navy, #0F172A)", fontWeight: 700 }}>✓</span>}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "12px", textAlign: "center", fontSize: 12, color: "var(--attendx-text-muted, #64748B)" }}>
                {emptyMessage}
              </div>
            )}

            {/* Custom Option Creator */}
            {allowCustom && search.trim() && !exactMatchExists && (
              <div
                onClick={handleCustomAdd}
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#2563EB",
                  cursor: "pointer",
                  borderTop: "1px dashed var(--attendx-border, #CBD5E1)",
                  background: "#EFF6FF",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>+</span>
                <span>
                  {customLabel}: "<strong>{search.trim()}</strong>"
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
