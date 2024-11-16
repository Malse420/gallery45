import { useState } from "react";
import { Search, Download, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import GalleryGrid from "@/components/GalleryGrid";
import SearchResults from "@/components/SearchResults";
import FilterSort, { FilterSortOptions } from "@/components/FilterSort";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [galleries, setGalleries] = useState([]);
  const [filterSortOptions, setFilterSortOptions] = useState<FilterSortOptions>({
    sortBy: "date",
  });
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast({
        title: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Replace with actual API call that includes filter/sort params
      const response = await fetch(
        `/api/search?term=${encodeURIComponent(searchTerm)}&maxVideos=${
          filterSortOptions.maxVideos || ""
        }&maxImages=${filterSortOptions.maxImages || ""}&sortBy=${
          filterSortOptions.sortBy
        }`
      );
      const data = await response.json();
      setGalleries(data.galleries);
    } catch (error) {
      toast({
        title: "Error searching galleries",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-[#2C3E50] mb-6">Gallery Manager</h1>
          <form onSubmit={handleSearch} className="space-y-4">
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
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  "Searching..."
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
            <FilterSort
              options={filterSortOptions}
              onChange={setFilterSortOptions}
            />
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {galleries.length > 0 ? (
          <GalleryGrid galleries={galleries} />
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No galleries found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Start by searching for galleries above
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;