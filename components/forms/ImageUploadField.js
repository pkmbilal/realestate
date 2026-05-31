"use client";

import { useRef, useState } from "react";

function filesFromList(fileList) {
  return Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
}

export function ImageUploadField() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  function syncFiles(nextFiles) {
    if (!inputRef.current) return;

    const transfer = new DataTransfer();
    nextFiles.forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
    setFiles(nextFiles);
  }

  function handleInputChange(event) {
    syncFiles(filesFromList(event.target.files));
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    syncFiles(filesFromList(event.dataTransfer.files));
  }

  function clearFiles() {
    syncFiles([]);
  }

  return (
    <div className="grid gap-3">
      <input
        ref={inputRef}
        className="sr-only"
        name="images"
        type="file"
        multiple
        onChange={handleInputChange}
      />
      <div
        className={`grid min-h-32 place-items-center rounded-md border border-dashed p-5 text-center ${
          isDragging ? "border-teal-700 bg-teal-50" : "border-zinc-300 bg-zinc-50"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div>
          <p className="text-sm font-semibold text-zinc-950">Drop property images here</p>
          <p className="mt-1 text-xs text-zinc-600">Drag images from File Explorer to avoid the slow file picker.</p>
          <button
            className="mt-3 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            Browse files
          </button>
        </div>
      </div>
      {files.length > 0 ? (
        <div className="rounded-md border border-zinc-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-950">{files.length} image{files.length === 1 ? "" : "s"} selected</p>
            <button className="text-sm font-medium text-red-700" type="button" onClick={clearFiles}>
              Clear
            </button>
          </div>
          <ul className="mt-2 grid gap-1 text-xs text-zinc-600">
            {files.map((file) => (
              <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
