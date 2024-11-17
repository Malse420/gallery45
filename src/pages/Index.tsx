import { useState, useCallback } from "react";
import { ArrowUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import TabResults from "@/components/TabResults";
import Statistics from "@/components/Statistics";
import { FilterSortOptions } from "@/components/FilterSort";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { debounce } from "lodash";
import GalleryExtractor from "@/components/GalleryExtractor";

const categories = [
  { name: "Teen", count: "1.81M", image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9" },
  { name: "Big", count: "8.96M", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c" },
  { name: "Hot", count: "623K", image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07" },
  { name: "Indian", count: "2.71M", image: "https://images.unsplash.com/photo-1518770660439-4636190af475" },
  { name: "French", count: "475K", image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7" },
  { name: "Anime", count: "9.49M", image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b" },
  { name: "Sneaky", count: "54.3K", image: "https://images.unsplash.com/photo-1408366744755-94b2074fa343" },
];

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory] = useLocalStorage<string[]>("searchHistory", []);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setIsSearching(false);
    }, 500),
    []
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setIsSearching(true);
    debouncedSearch(term);
  };

  const handleFilterSort = (type: string, options: FilterSortOptions) => {
    // This is handled within TabResults component
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <header className="bg-[#222] px-5 py-6 sticky top-0 z-10">
        <nav className="flex justify-center gap-12 mb-6">
          {[...Array(4)].map((_, i) => (
            <button key={i} className="text-white hover:text-primary transition-colors">
              <ArrowUp className="h-6 w-6" />
            </button>
          ))}
        </nav>
        
        <div className="max-w-4xl mx-auto relative">
          <Input
            type="text"
            placeholder="Search 45,075,326 videos..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full text-xl py-6 px-4 bg-transparent border-white/20 text-white placeholder:text-white/60 focus-visible:ring-primary"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-white/60" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Statistics />
        
        <section className="mt-12">
          <h2 className="text-3xl font-bold mb-8">Most Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div key={category.name} className="space-y-3">
                <div className="aspect-video relative overflow-hidden rounded-lg group cursor-pointer">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xl font-bold">{category.name}</span>
                  </div>
                </div>
                <p className="text-lg font-medium text-white/80">{category.count}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12">
          <GalleryExtractor />
          <TabResults
            searchTerm={searchTerm}
            isSearching={isSearching}
            onSearch={handleFilterSort}
            galleries={[]}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;