import { Card, CardContent } from "@/components/ui/card";
import { Video, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  videoCount?: number;
  imageCount?: number;
}

interface SearchResultsListProps {
  results: SearchResult[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const SearchResultsList = ({ 
  results, 
  isLoading = false, 
  hasMore = false, 
  onLoadMore 
}: SearchResultsListProps) => {
  if (isLoading && results.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-40 bg-gray-200 rounded-md mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result) => (
          <Card key={result.id}>
            <CardContent className="p-4">
              {result.thumbnailUrl && (
                <img
                  src={result.thumbnailUrl}
                  alt={result.title}
                  className="w-full h-40 object-cover rounded-md mb-2"
                />
              )}
              <h3 className="font-medium text-sm line-clamp-2 mb-2">{result.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                {result.videoCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    <span>{result.videoCount}</span>
                  </div>
                )}
                {result.imageCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    <span>{result.imageCount}</span>
                  </div>
                )}
              </div>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline block"
              >
                View Gallery
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-4">
          <Button onClick={onLoadMore} variant="outline">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchResultsList;