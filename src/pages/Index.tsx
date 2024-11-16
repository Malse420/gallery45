import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import TabResults from "@/components/TabResults";
import { FilterSortOptions } from "@/components/FilterSort";
import { useQuery } from "@tanstack/react-query";
import { fetchGalleries, GalleryFilters } from "@/services/galleryService";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<GalleryFilters>({});
  const { toast } = useToast();

  const { data: galleries, isLoading } = useQuery({
    queryKey: ['galleries', filters],
    queryFn: () => fetchGalleries(filters),
  });

  const handleSearch = async (type: string, options: FilterSortOptions) => {
    const newFilters: GalleryFilters = {
      minVideos: options.minVideos,
      maxVideos: options.maxVideos,
      minImages: options.maxImages,
      maxImages: options.maxImages,
      minDuration: options.minDuration,
      maxDuration: options.maxDuration,
    };
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-[#2C3E50] mb-6">Gallery Search</h1>
          <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search galleries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  "Searching..."
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <TabResults
          searchTerm={searchTerm}
          isSearching={isLoading}
          onSearch={handleSearch}
          galleries={galleries || []}
        />
      </main>
    </div>
  );
};

export default Index;