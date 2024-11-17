import { useState, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import TabResults from "@/components/TabResults";
import { FilterSortOptions } from "@/components/FilterSort";
import { useQuery } from "@tanstack/react-query";
import { fetchGalleries, GalleryFilters } from "@/services/galleryService";
import { useInView } from "react-intersection-observer";
import debounce from "lodash/debounce";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { MoonIcon, SunIcon } from "lucide-react";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<GalleryFilters>({});
  const [page, setPage] = useState(1);
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>("searchHistory", []);
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>("darkMode", false);
  const { toast } = useToast();
  const { ref, inView } = useInView();

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const { data: galleries = [], isLoading, fetchNextPage, hasNextPage } = useQuery({
    queryKey: ['galleries', filters, page],
    queryFn: () => fetchGalleries({ ...filters, page }),
    keepPreviousData: true,
  });

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isLoading) {
      setPage(prev => prev + 1);
      fetchNextPage();
    }
  }, [inView, hasNextPage, isLoading]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.trim()) {
        setFilters(prev => ({ ...prev, searchTerm: term }));
        setPage(1);
        // Add to search history
        setSearchHistory(prev => {
          const newHistory = [term, ...prev.filter(h => h !== term)].slice(0, 5);
          return newHistory;
        });
      }
    }, 500),
    []
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const handleSearchHistoryClick = (term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-foreground">Gallery Search</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="ml-2"
            >
              {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </Button>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search galleries..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
                {searchTerm && searchHistory.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-card border rounded-md mt-1 shadow-lg z-20">
                    {searchHistory.map((term, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
                        onClick={() => handleSearchHistoryClick(term)}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
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
          onSearch={(type, options) => {
            const newFilters: GalleryFilters = {
              minVideos: options.minVideos,
              maxVideos: options.maxVideos,
              minImages: options.maxImages,
              maxImages: options.maxImages,
              minDuration: options.minDuration,
              maxDuration: options.maxDuration,
            };
            setFilters(newFilters);
          }}
          galleries={galleries}
        />
        <div ref={ref} className="h-10" />
      </main>
    </div>
  );
};

export default Index;