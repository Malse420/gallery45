import { Card } from "@/components/ui/card";
import GalleryGrid from "./GalleryGrid";
import { FilterSortOptions } from "./FilterSort";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LibraryTabsContentProps {
  type: "galleries" | "videos" | "images";
  filterOptions: FilterSortOptions;
}

const LibraryTabsContent = ({ type, filterOptions }: LibraryTabsContentProps) => {
  const { data: items } = useQuery({
    queryKey: [`library-${type}`, filterOptions],
    queryFn: async () => {
      let query = supabase.from(`cached_${type}`).select("*");

      if (type === "galleries" || type === "videos") {
        if (filterOptions.minDuration) {
          query = query.gte(type === "galleries" ? "total_duration" : "duration", filterOptions.minDuration);
        }
        if (filterOptions.maxDuration) {
          query = query.lte(type === "galleries" ? "total_duration" : "duration", filterOptions.maxDuration);
        }
      }

      if (type === "galleries") {
        if (filterOptions.minVideos) query = query.gte("video_count", filterOptions.minVideos);
        if (filterOptions.maxVideos) query = query.lte("video_count", filterOptions.maxVideos);
        if (filterOptions.minImages) query = query.gte("image_count", filterOptions.minImages);
        if (filterOptions.maxImages) query = query.lte("image_count", filterOptions.maxImages);
      }

      if (type === "videos" || type === "images") {
        if (filterOptions.minFileSize) {
          query = query.gte("size_bytes", filterOptions.minFileSize * 1024 * 1024);
        }
        if (filterOptions.maxFileSize) {
          query = query.lte("size_bytes", filterOptions.maxFileSize * 1024 * 1024);
        }
      }

      switch (filterOptions.sortBy) {
        case "date":
          query = query.order("created_at", { ascending: false });
          break;
        case "size-asc":
          query = query.order("size_bytes", { ascending: true });
          break;
        case "size-desc":
          query = query.order("size_bytes", { ascending: false });
          break;
        case "duration-asc":
          query = query.order(type === "galleries" ? "total_duration" : "duration", { ascending: true });
          break;
        case "duration-desc":
          query = query.order(type === "galleries" ? "total_duration" : "duration", { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (!items?.length) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No {type} in your library
      </Card>
    );
  }

  if (type === "galleries") {
    return (
      <GalleryGrid
        galleries={items.map((g: any) => ({
          id: g.id,
          title: g.title || "",
          url: g.url,
          thumbnail: g.thumbnail_url || "",
          videoCount: g.video_count || 0,
          imageCount: g.image_count || 0,
          duration: g.total_duration,
        }))}
      />
    );
  }

  return (
    <div className={`grid grid-cols-${type === "videos" ? "3" : "4"} gap-4`}>
      {items.map((item: any) => (
        <Card key={item.id} className="overflow-hidden">
          <div className={`aspect-${type === "videos" ? "video" : "square"} relative`}>
            <img
              src={item.thumbnail_url || item.url}
              alt={item.title || ""}
              className="w-full h-full object-cover"
            />
          </div>
          {type === "videos" && (
            <div className="p-4">
              <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default LibraryTabsContent;