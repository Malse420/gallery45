import { useState } from "react";
import { Expand, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInView } from "react-intersection-observer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

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
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <Card className="bg-card rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:scale-105">
        <div ref={ref} className="relative aspect-video">
          {inView && (
            <img
              src={gallery.thumbnail}
              alt={gallery.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => setShowPreview(true)}
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-foreground mb-2 line-clamp-2">
            {gallery.title}
          </h3>
          
          {isExpanded && (
            <div className="mt-4 space-y-2 animate-accordion-down">
              <p className="text-sm text-muted-foreground">{gallery.description}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
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

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{gallery.title}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="mt-4">
            <img
              src={gallery.thumbnail}
              alt={gallery.title}
              className="w-full h-auto rounded-lg"
            />
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">{gallery.description}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
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
          </div>
        </DialogContent>
      </Dialog>
    </>
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