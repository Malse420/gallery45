import { useState, useCallback, useEffect } from "react";
import { Search, MoonIcon, SunIcon, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TabResults from "@/components/TabResults";
import Statistics from "@/components/Statistics";
import { FilterSortOptions } from "@/components/FilterSort";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchGalleries, GalleryFilters } from "@/services/galleryService";
import { useInView } from "react-intersection-observer";
import debounce from "lodash/debounce";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<GalleryFilters>({});
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>("searchHistory", []);
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>("darkMode", false);
  const { ref, inView } = useInView();

  const { 
    data, 
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['galleries', filters],
    queryFn: ({ pageParam = 0 }) => fetchGalleries({ ...filters, pageParam }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? (lastPage.pageCount ?? 0) + 1 : undefined,
    initialPageParam: 0
  });

  useEffect(() => {
    if (inView && hasNextPage && !isLoading && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isLoading, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.trim()) {
        setFilters(prev => ({ ...prev, searchTerm: term }));
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

  const galleries = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Statistics />
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center mb-4 relative">
            <div className="flex items-center gap-2 animate-fade-in">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <h1 className="text-4xl font-bold text-foreground">Gallery Search</h1>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="absolute right-0 top-1/2 -translate-y-1/2 hover:animate-scale-in"
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
                  className="w-full transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                />
                {searchTerm && searchHistory.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-card border rounded-md mt-1 shadow-lg z-20 animate-fade-in">
                    {searchHistory.map((term, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-2 hover:bg-accent text-sm transition-colors duration-200"
                        onClick={() => handleSearchHistoryClick(term)}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="transition-all duration-200 hover:animate-scale-in"
              >
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
        <div className="mt-8">
          <TabResults
            searchTerm={searchTerm}
            isSearching={isLoading}
            onSearch={(type, options) => {
              setFilters(prev => ({ ...prev, ...options }));
            }}
            galleries={galleries}
          />
        </div>
        {!isLoading && hasNextPage && (
          <div ref={ref} className="h-10" />
        )}
      </main>
    </div>
  );
};

export default Index;