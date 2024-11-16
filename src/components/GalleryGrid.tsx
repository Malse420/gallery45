import { useState } from "react";
import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Gallery {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
}

interface GalleryGridProps {
  galleries: Gallery[];
}

const GalleryGrid = ({ galleries }: GalleryGridProps) => {
  const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleGallery = (id: string) => {
    const newSelected = new Set(selectedGalleries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGalleries(newSelected);
  };

  const downloadGallery = async (gallery: Gallery) => {
    setDownloading((prev) => new Set([...prev, gallery.id]));
    try {
      // TODO: Replace with actual API call
      await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: gallery.url }),
      });
      
      toast({
        title: "Download started",
        description: `${gallery.title} is being downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setDownloading((prev) => {
        const newDownloading = new Set(prev);
        newDownloading.delete(gallery.id);
        return newDownloading;
      });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {galleries.map((gallery) => (
        <div
          key={gallery.id}
          className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]"
        >
          <div className="relative aspect-video">
            <img
              src={gallery.thumbnail || "/placeholder.svg"}
              alt={gallery.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => toggleGallery(gallery.id)}
              className={`absolute top-2 right-2 p-2 rounded-full ${
                selectedGalleries.has(gallery.id)
                  ? "bg-[#FF4785] text-white"
                  : "bg-white/80 text-gray-700"
              }`}
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {gallery.title}
            </h3>
            <Button
              onClick={() => downloadGallery(gallery)}
              disabled={downloading.has(gallery.id)}
              className="w-full"
              variant="outline"
            >
              {downloading.has(gallery.id) ? (
                "Downloading..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;