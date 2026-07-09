import { useEffect, useRef, useState } from "react";
import { getReceiptThumbnail } from "../services/api";
import { Receipt } from "lucide-react";

export default function LazyReceiptImage({ fileId, alt, className = "" }) {
  const containerRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!fileId || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || src || loading || failed) return;

        setLoading(true);
        getReceiptThumbnail(fileId)
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            setSrc(url);
          })
          .catch(() => setFailed(true))
          .finally(() => setLoading(false));
      },
      { rootMargin: "100px" },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fileId, src, loading, failed]);

  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);

  if (!fileId || failed) {
    return (
      <div
        ref={containerRef}
        className={`flex h-full w-full items-center justify-center bg-gray-100 text-gray-300 ${className}`}
      >
        <Receipt size={32} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`h-full w-full overflow-hidden bg-gray-50 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
      ) : (
        <div className="flex h-full w-full animate-pulse items-center justify-center bg-gray-100 text-xs text-gray-400">
          {loading ? "..." : ""}
        </div>
      )}
    </div>
  );
}
