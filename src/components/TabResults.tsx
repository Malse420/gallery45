import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterSortOptions } from "@/components/FilterSort";
import SearchResultsList from "./search/SearchResultsList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TabResultsProps {
  searchTerm: string;
  isSearching: boolean;
  onSearch: (type: string, options: FilterSortOptions) => void;
  galleries: any[];
}

const TabResults = ({ searchTerm, isSearching }: TabResultsProps) => {
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) {
        return { results: [] };
      }

      const { data, error } = await supabase.functions.invoke('search-content', {
        body: { 
          query: searchTerm.trim(),
          type: 'galleries' // This will be dynamic based on active tab
        }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!searchTerm.trim(),
  });

  return (
    <Tabs defaultValue="galleries" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="galleries">
          Galleries ({searchResults?.results?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="videos">Videos</TabsTrigger>
        <TabsTrigger value="images">Images</TabsTrigger>
      </TabsList>

      <TabsContent value="galleries">
        <SearchResultsList
          results={searchResults?.results || []}
          isLoading={isLoading || isSearching}
        />
      </TabsContent>
      
      <TabsContent value="videos">
        <div className="text-center py-8 text-muted-foreground">
          Video search coming soon
        </div>
      </TabsContent>
      
      <TabsContent value="images">
        <div className="text-center py-8 text-muted-foreground">
          Image search coming soon
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default TabResults;