import { useState, useRef } from "react";

export default function CsvUploader({ onFileContent }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileName(file.name);
      onFileContent(e.target.result);
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setFileName(null);
    setError(null);
    onFileContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? "border-accent bg-canvas"
            : "border-line hover:border-line-strong hover:bg-surface"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden"
        />

        {fileName ? (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-10 h-10 text-positive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-white font-sans">{fileName}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-sm text-muted hover:text-white transition-colors"
            >
              Choose a different file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-10 h-10 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-white font-sans">
              Drag & drop a CSV file here
            </p>
            <p className="text-muted text-sm">or click to browse</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-negative text-sm font-sans">{error}</p>
      )}
    </div>
  );
}
