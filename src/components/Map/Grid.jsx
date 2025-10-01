import React from "react";

export default function Grid({ map, placeTile }) {
if (!map || !map.length || !map[0].length) {
    return <div className="text-red-500">⚠️ Map data is invalid</div>;
  }

  const rows = map.length;
  const cols = map[0].length;

  return (
    <div className="w-full h-full p-2 min-w-0 min-h-0">
      <div
        className="grid w-full h-full"
        style={{
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {map.map((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              onClick={() => placeTile(ri, ci)}
              className="border border-gray-600 cursor-pointer"
              style={{
                backgroundColor:
                  cell === "grass"
                    ? "green"
                    : cell === "water"
                    ? "blue"
                    : cell === "stone"
                    ? "gray"
                    : "transparent",
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
