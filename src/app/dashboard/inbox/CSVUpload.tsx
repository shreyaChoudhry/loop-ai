"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";

export default function CSVUpload() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [error, setError] =
    useState("");

  const [isDragging, setIsDragging] =
    useState(false);

  const [isImporting, setIsImporting] =
    useState(false);

  const [result, setResult] =
    useState<{
      imported: number;
      failed: number;
    } | null>(null);

  // --------------------------------
  // File validation
  // --------------------------------

  const validateFile = (
    file: File
  ) => {
    setError("");
    setResult(null);

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setSelectedFile(null);

      setError(
        "Please upload a CSV file."
      );

      return false;
    }

    if (file.size === 0) {
      setSelectedFile(null);

      setError(
        "The selected CSV file is empty."
      );

      return false;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setSelectedFile(null);

      setError(
        "CSV file must be smaller than 10 MB."
      );

      return false;
    }

    setSelectedFile(file);

    return true;
  };

  // --------------------------------
  // Browse
  // --------------------------------

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    validateFile(file);
  };

  // --------------------------------
  // Drag
  // --------------------------------

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setIsDragging(true);
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setIsDragging(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    validateFile(file);
  };

  // --------------------------------
  // Open picker
  // --------------------------------

  const openFilePicker = () => {
    if (isImporting) {
      return;
    }

    fileInputRef.current?.click();
  };

  // --------------------------------
  // Import
  // --------------------------------

  const handleImport = async () => {
    if (!selectedFile) {
      setError(
        "Please select a CSV file first."
      );

      return;
    }

    try {
      setIsImporting(true);
      setError("");
      setResult(null);

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await fetch(
          "/api/feedback/import",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to import CSV."
        );
      }

      setResult({
        imported:
          data.imported ?? 0,
        failed:
          data.failed ?? 0,
      });

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }

      // Reload server data after
      // successful import
      window.location.reload();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to import CSV."
      );
    } finally {
      setIsImporting(false);
    }
  };

  // --------------------------------
  // Remove
  // --------------------------------

  const removeFile = () => {
    setSelectedFile(null);
    setError("");
    setResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Upload CSV
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Import customer feedback from a
          CSV file.
        </p>
      </div>

      {/* Drop zone */}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        className={`mt-5 cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragging
            ? "border-purple-500 bg-purple-50"
            : "border-zinc-300 bg-zinc-50 hover:border-purple-400 hover:bg-purple-50/40"
        } ${
          isImporting
            ? "cursor-not-allowed opacity-60"
            : ""
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-xl">
          📄
        </div>

        <h3 className="mt-4 text-sm font-semibold text-zinc-900">
          Drop your CSV here
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          or browse files from your
          computer
        </p>

        <p className="mt-2 text-xs text-zinc-400">
          CSV files up to 10 MB
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={isImporting}
        />
      </div>

      {/* Selected file */}

      {selectedFile && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-green-800">
              {selectedFile.name}
            </p>

            <p className="mt-0.5 text-xs text-green-600">
              {(
                selectedFile.size /
                1024
              ).toFixed(1)}{" "}
              KB
            </p>
          </div>

          <button
            type="button"
            disabled={isImporting}
            onClick={(event) => {
              event.stopPropagation();

              removeFile();
            }}
            className="ml-4 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      )}

      {/* Error */}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* Result */}

      {result && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-800">
            Imported:{" "}
            {result.imported}
          </p>

          <p className="mt-1 text-sm text-red-600">
            Failed:{" "}
            {result.failed}
          </p>
        </div>
      )}

      {/* Import button */}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleImport}
          disabled={
            !selectedFile ||
            isImporting
          }
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isImporting
            ? "Importing..."
            : "Import Feedback"}
        </button>
      </div>
    </div>
  );
}