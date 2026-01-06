import React, { useState, useRef, useEffect } from "react";

function AdvancedCellEditors({ value = "", onChange }) {
  const [text, setText] = useState(value);
  const editorRef = useRef(null);

  useEffect(() => {
    if (onChange) {
      onChange(text);
    }
  }, [text, onChange]);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: "-36px",
          left: 0,
          display: "flex",
          gap: "6px",
        }}
      >
        <button type="button" onClick={() => setText((prev) => prev + "**")}>
          Negrita
        </button>

        <button type="button" onClick={() => setText((prev) => prev + "_")}>
          Cursiva
        </button>

        <button
          type="button"
          onClick={() => setText((prev) => prev + "- [ ] ")}
        >
          Checklist
        </button>
      </div>

      <textarea
        ref={editorRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", height: "80px" }}
      />
    </div>
  );
}

export default AdvancedCellEditors;
