import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) {
        return { results: [] };
      }

      const { data, error } = await supabase.functions.invoke('search-galleries', {
        body: { query: query.trim() },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!query.trim(),
  });
};