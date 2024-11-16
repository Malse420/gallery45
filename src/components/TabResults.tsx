import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchResults from "@/components/SearchResults";
import FilterSort, { FilterSortOptions } from "@/components/FilterSort";
import { useState } from "react";

interface TabResultsProps {
  searchTerm: string;
  isSearching: boolean;
  galleries: any[];
  onSearch: (type: string, options: FilterSortOptions) => void;
}

const TabResults = ({ searchTerm, isSearching, galleries, onSearch }: TabResultsProps) => {
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterSortOptions>>({
    galleries: { sortBy: "date" },
    videos: { sortBy: "date" },
    images: { sortBy: "date" },
  });

  const handleFilterChange = (type: string, options: FilterSortOptions) => {
    setFilterOptions((prev) => ({ ...prev, [type]: options }));
    onSearch(type, options);
  };

  const searchResults = galleries.map(gallery => ({
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
        <TabsTrigger value="galleries">Galleries</TabsTrigger>
        <TabsTrigger value="videos">Videos</TabsTrigger>
        <TabsTrigger value="images">Images</TabsTrigger>
      </TabsList>
      <TabsContent value="galleries">
        <FilterSort
          type="galleries"
          options={filterOptions.galleries}
          onChange={(options) => handleFilterChange("galleries", options)}
        />
        <SearchResults
          results={searchResults}
          isLoading={isSearching}
        />
      </TabsContent>
      <TabsContent value="videos">
        <FilterSort
          type="videos"
          options={filterOptions.videos}
          onChange={(options) => handleFilterChange("videos", options)}
        />
        <SearchResults
          results={[]}
          isLoading={isSearching}
        />
      </TabsContent>
      <TabsContent value="images">
        <FilterSort
          type="images"
          options={filterOptions.images}
          onChange={(options) => handleFilterChange("images", options)}
        />
        <SearchResults
          results={[]}
          isLoading={isSearching}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TabResults;