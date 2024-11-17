import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterSort, { FilterSortOptions } from "./FilterSort";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import GalleryGrid from "./GalleryGrid";

const Library = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterSortOptions>({
    sortBy: "date",
  });

  const { data: galleries } = useQuery({
    queryKey: ["library-galleries", filterOptions],
    queryFn: async () => {
      const query = supabase
        .from("cached_galleries")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (filterOptions.minVideos) {
        query.gte("video_count", filterOptions.minVideos);
      }
      if (filterOptions.maxVideos) {
        query.lte("video_count", filterOptions.maxVideos);
      }
      if (filterOptions.minImages) {
        query.gte("image_count", filterOptions.minImages);
      }
      if (filterOptions.maxImages) {
        query.lte("image_count", filterOptions.maxImages);
      }
      if (filterOptions.minDuration) {
        query.gte("total_duration", filterOptions.minDuration);
      }
      if (filterOptions.maxDuration) {
        query.lte("total_duration", filterOptions.maxDuration);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: videos } = useQuery({
    queryKey: ["library-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cached_videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: images } = useQuery({
    queryKey: ["library-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cached_images")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div
      className={`fixed bottom-0 right-0 left-0 transition-all duration-300 ease-in-out bg-background/50 backdrop-blur-sm border-t border-border shadow-lg ${
        isExpanded ? "h-[70vh]" : "h-14"
      }`}
    >
      <div className="container mx-auto relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>

        <Tabs defaultValue="galleries" className="w-full h-full">
          <TabsList className="h-14 w-full grid grid-cols-3">
            <TabsTrigger value="galleries">
              Galleries ({galleries?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="videos">
              Videos ({videos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="images">
              Images ({images?.length || 0})
            </TabsTrigger>
          </TabsList>

          <div className={`overflow-auto ${isExpanded ? "h-[calc(70vh-3.5rem)]" : "h-0"}`}>
            <TabsContent value="galleries" className="p-4">
              <FilterSort
                options={filterOptions}
                onChange={setFilterOptions}
                type="galleries"
              />
              {galleries && galleries.length > 0 ? (
                <GalleryGrid
                  galleries={galleries.map(g => ({
                    id: g.id,
                    title: g.title || "",
                    url: g.url,
                    thumbnail: g.thumbnail_url || "",
                    videoCount: g.video_count || 0,
                    imageCount: g.image_count || 0,
                    duration: g.total_duration,
                  }))}
                />
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  No galleries in your library
                </Card>
              )}
            </TabsContent>

            <TabsContent value="videos" className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos?.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={video.thumbnail_url || ""}
                        alt={video.title || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {video.title}
                      </h3>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="images" className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images?.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={image.thumbnail_url || image.url}
                        alt={image.title || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Library;