import { useState } from "react";
import { Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInView } from "react-intersection-observer";

interface Gallery {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  description?: string;
  videoCount?: number;
  imageCount?: number;
  duration?: number;
}

interface GalleryGridProps {
  galleries: Gallery[];
}

const GalleryItem = ({ gallery }: { gallery: Gallery }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden">
      <div ref={ref} className="relative aspect-video">
        <img
          src={gallery.thumbnail}
          alt={gallery.title}
          className="w-full h-full object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Expand className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {gallery.title}
        </h3>
        
        {isExpanded && (
          <div className="mt-4 space-y-2 animate-accordion-down">
            <p className="text-sm text-gray-600">{gallery.description}</p>
            <div className="flex gap-4 text-sm text-gray-500">
              {gallery.videoCount !== undefined && (
                <span>Videos: {gallery.videoCount}</span>
              )}
              {gallery.imageCount !== undefined && (
                <span>Images: {gallery.imageCount}</span>
              )}
              {gallery.duration !== undefined && (
                <span>Duration: {Math.floor(gallery.duration / 60)}m {gallery.duration % 60}s</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const GalleryGrid = ({ galleries }: GalleryGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {galleries.map((gallery) => (
        <GalleryItem key={gallery.id} gallery={gallery} />
      ))}
    </div>
  );
};

export default GalleryGrid;