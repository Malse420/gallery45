import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchResults from "@/components/SearchResults";
import FilterSort, { FilterSortOptions } from "@/components/FilterSort";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TabResultsProps {
  searchTerm: string;
  isSearching: boolean;
  galleries: any[];
  onSearch: (type: string, options: FilterSortOptions) => void;
}

const ITEMS_PER_PAGE = 20;

const TabResults = ({ searchTerm, isSearching, galleries, onSearch }: TabResultsProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterSortOptions>>({
    galleries: { sortBy: "date" },
    videos: { sortBy: "date" },
    images: { sortBy: "date" },
  });

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchTerm, filterOptions.galleries, currentPage],
    queryFn: async () => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('cached_galleries')
        .select('*', { count: 'exact' });

      // Apply search term
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      // Apply filter options
      if (filterOptions.galleries.minVideos) {
        query = query.gte('video_count', filterOptions.galleries.minVideos);
      }
      if (filterOptions.galleries.maxVideos) {
        query = query.lte('video_count', filterOptions.galleries.maxVideos);
      }
      if (filterOptions.galleries.minImages) {
        query = query.gte('image_count', filterOptions.galleries.minImages);
      }
      if (filterOptions.galleries.maxImages) {
        query = query.lte('image_count', filterOptions.galleries.maxImages);
      }

      // Apply sorting
      switch (filterOptions.galleries.sortBy) {
        case "videos-desc":
          query = query.order('video_count', { ascending: false });
          break;
        case "videos-asc":
          query = query.order('video_count', { ascending: true });
          break;
        case "images-desc":
          query = query.order('image_count', { ascending: false });
          break;
        case "images-asc":
          query = query.order('image_count', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(start, end);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        totalCount: count || 0,
        hasMore: count ? count > (end + 1) : false
      };
    },
    enabled: true,
  });

  const { data: videoResults } = useQuery({
    queryKey: ['videos', searchTerm, filterOptions.videos, currentPage],
    queryFn: async () => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('cached_videos')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      query = query.range(start, end);
      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        totalCount: count || 0,
        hasMore: count ? count > (end + 1) : false
      };
    },
    enabled: true,
  });

  const { data: imageResults } = useQuery({
    queryKey: ['images', searchTerm, filterOptions.images, currentPage],
    queryFn: async () => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('cached_images')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      query = query.range(start, end);
      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        totalCount: count || 0,
        hasMore: count ? count > (end + 1) : false
      };
    },
    enabled: true,
  });

  const handleFilterChange = (type: string, options: FilterSortOptions) => {
    setFilterOptions((prev) => ({ ...prev, [type]: options }));
    setCurrentPage(1); // Reset to first page when filters change
    onSearch(type, options);
  };

  const formattedGalleryResults = (searchResults?.data || []).map(gallery => ({
    id: gallery.id,
    title: gallery.title || 'Untitled Gallery',
    url: gallery.url,
    thumbnailUrl: gallery.thumbnail_url,
    videoCount: gallery.video_count || 0,
    imageCount: gallery.image_count || 0,
  }));

  return (
    <Tabs defaultValue="galleries" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="galleries">
          Galleries ({searchResults?.totalCount || 0})
        </TabsTrigger>
        <TabsTrigger value="videos">
          Videos ({videoResults?.totalCount || 0})
        </TabsTrigger>
        <TabsTrigger value="images">
          Images ({imageResults?.totalCount || 0})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="galleries">
        <FilterSort
          type="galleries"
          options={filterOptions.galleries}
          onChange={(options) => handleFilterChange("galleries", options)}
        />
        <SearchResults
          results={formattedGalleryResults}
          isLoading={isSearching}
          hasMore={searchResults?.hasMore}
          onLoadMore={() => setCurrentPage(prev => prev + 1)}
        />
      </TabsContent>
      <TabsContent value="videos">
        <FilterSort
          type="videos"
          options={filterOptions.videos}
          onChange={(options) => handleFilterChange("videos", options)}
        />
        <SearchResults
          results={videoResults?.data || []}
          isLoading={isSearching}
          hasMore={videoResults?.hasMore}
          onLoadMore={() => setCurrentPage(prev => prev + 1)}
        />
      </TabsContent>
      <TabsContent value="images">
        <FilterSort
          type="images"
          options={filterOptions.images}
          onChange={(options) => handleFilterChange("images", options)}
        />
        <SearchResults
          results={imageResults?.data || []}
          isLoading={isSearching}
          hasMore={imageResults?.hasMore}
          onLoadMore={() => setCurrentPage(prev => prev + 1)}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TabResults;