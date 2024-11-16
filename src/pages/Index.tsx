import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import TabResults from "@/components/TabResults";
import { FilterSortOptions } from "@/components/FilterSort";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (type: string, options: FilterSortOptions) => {
    if (!searchTerm.trim()) {
      toast({
        title: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Replace with actual API call that includes filter/sort params and type
      const response = await fetch(
        `/api/search?term=${encodeURIComponent(searchTerm)}&type=${type}&${new URLSearchParams(
          options as any
        ).toString()}`
      );
      const data = await response.json();
      // Handle the response data based on the type (galleries, videos, or images)
    } catch (error) {
      toast({
        title: "Error searching content",
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
          <h1 className="text-4xl font-bold text-[#2C3E50] mb-6">Content Search</h1>
          <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search content..."
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
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <TabResults
          searchTerm={searchTerm}
          isSearching={isSearching}
          onSearch={handleSearch}
        />
      </main>
    </div>
  );
};

export default Index;