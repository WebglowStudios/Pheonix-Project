"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faUpload, faTrash, faSpinner, faCheck, faImage } from "@fortawesome/free-solid-svg-icons";

interface ImageItem {
  name: string;
  url: string;
  size: number;
}

interface ImageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function ImageSelectorModal({ isOpen, onClose, onSelect }: ImageSelectorModalProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  async function fetchImages() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      if (data.success) {
        setImages(data.images || []);
      } else {
        setError(data.error || "Failed to load images");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    await uploadFile(file);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        await fetchImages();
      } else {
        setError(data.error || "Failed to upload file");
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(name: string) {
    setError("");
    try {
      const res = await fetch(`/api/media?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setImages((prev) => prev.filter((img) => img.name !== name));
        setDeleteConfirm(null);
      } else {
        setError(data.error || "Failed to delete file");
      }
    } catch (err: any) {
      setError(err.message || "Deletion failed");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
      <div className="bg-white w-full max-w-[850px] h-[85vh] rounded-[12px] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fafafa]">
          <div>
            <h3 className="font-bold text-gray-800 text-[1.1rem]">Media Library</h3>
            <p className="text-gray-500 text-xs mt-0.5">Upload, delete, and pick images in the public folder</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full">
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          
          {/* Main List */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-gray-100">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-[8px] font-semibold">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <FontAwesomeIcon icon={faSpinner} className="text-[#E8740C] text-2xl animate-spin mb-2" />
                <span className="text-gray-500 text-xs font-semibold">Scanning public folder...</span>
              </div>
            ) : images.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[10px]">
                <FontAwesomeIcon icon={faImage} className="text-gray-300 text-3xl mb-3" />
                <p className="font-semibold text-gray-700 text-sm">No images found</p>
                <p className="text-gray-400 text-xs mt-1 max-w-[240px]">Drag and drop files in the upload area to add them to your assets.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img.name} className="group relative bg-gray-50 border border-gray-200 rounded-[10px] overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-[#E8740C]">
                    {/* Thumbnail preview */}
                    <div className="relative h-[120px] bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-200">
                      <Image src={img.url} alt={img.name} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 768px) 50vw, 33vw" unoptimized />
                    </div>
                    {/* Caption */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-xs truncate" title={img.name}>{img.name}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5">{formatBytes(img.size)}</p>
                      </div>
                      
                      {/* Selection / deletion overlay on hover / select buttons */}
                      <div className="mt-3 flex gap-1.5">
                        <button
                          onClick={() => onSelect(img.url)}
                          className="flex-1 bg-[#E8740C] text-white rounded-[6px] py-1.5 text-[10px] font-bold hover:bg-[#FF9433] transition-all flex items-center justify-center gap-1"
                        >
                          <FontAwesomeIcon icon={faCheck} className="text-[8px]" />
                          Select
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(img.name)}
                          className="border border-red-200 text-red-600 rounded-[6px] p-1.5 text-[10px] hover:bg-red-50 transition-all flex items-center justify-center"
                          title="Delete File"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>

                    {/* Local confirmation overlay for deleting this item */}
                    {deleteConfirm === img.name && (
                      <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-3 text-center z-10">
                        <p className="font-bold text-gray-800 text-xs leading-tight">Delete this image?</p>
                        <p className="text-gray-400 text-[9px] mt-1">This deletes the actual file.</p>
                        <div className="flex gap-1.5 mt-3 w-full">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1 border border-gray-200 text-gray-600 rounded-[4px] py-1 text-[9px] font-semibold hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(img.name)}
                            className="flex-1 bg-red-600 text-white rounded-[4px] py-1 text-[9px] font-semibold hover:bg-red-700"
                          >
                            Yes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Sidebar Panel */}
          <div className="w-full md:w-[250px] p-6 bg-[#fafafa] flex flex-col flex-shrink-0">
            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-4">Upload New File</h4>
            
            <label className="flex-1 min-h-[140px] md:min-h-0 border-2 border-dashed border-gray-300 rounded-[10px] flex flex-col items-center justify-center p-4 cursor-pointer hover:border-[#E8740C] bg-white transition-all group">
              <input type="file" onChange={handleUpload} accept="image/*" className="hidden" disabled={uploading} />
              
              {uploading ? (
                <div className="text-center">
                  <FontAwesomeIcon icon={faSpinner} className="text-[#E8740C] text-xl animate-spin mb-2" />
                  <p className="text-gray-600 text-xs font-semibold">Uploading asset...</p>
                </div>
              ) : (
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 group-hover:text-[#E8740C] group-hover:border-[#E8740C]/30 mb-2 transition-all">
                    <FontAwesomeIcon icon={faUpload} className="text-xs" />
                  </div>
                  <p className="font-bold text-gray-700 text-xs group-hover:text-[#E8740C]">Browse files</p>
                  <p className="text-gray-400 text-[10px] mt-1 max-w-[140px] leading-tight">Drop files or click here to upload images.</p>
                </div>
              )}
            </label>

            <div className="mt-5 border-t border-gray-200 pt-4">
              <h5 className="font-bold text-gray-700 text-[10px] uppercase mb-2 tracking-wider">Format Rules</h5>
              <ul className="text-[10px] text-gray-500 flex flex-col gap-1.5">
                <li>• Accepted: PNG, JPG, JPEG, SVG, WEBP, GIF</li>
                <li>• Files write directly to <code>/public/</code> folder</li>
                <li>• Spaces and special symbols get clean underscores</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
