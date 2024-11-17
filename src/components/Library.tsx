import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterSort, { FilterSortOptions } from "./FilterSort";
import LibraryTabsContent from "./LibraryTabsContent";

const Library = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterSortOptions>({
    sortBy: "date",
  });

  return (
    <div
      className={`fixed bottom-0 right-0 left-0 transition-all duration-300 ease-in-out bg-background/50 backdrop-blur-sm border-t border-border shadow-lg ${
        isExpanded ? "h-[70vh]" : "h-14"
      }`}
    >
      <div className="container mx-auto relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>

        <Tabs defaultValue="galleries" className="w-full h-full">
          <TabsList className="h-14 w-full grid grid-cols-3">
            <TabsTrigger value="galleries">Galleries</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <div className={`overflow-auto ${isExpanded ? "h-[calc(70vh-3.5rem)]" : "h-0"}`}>
            {["galleries", "videos", "images"].map((type) => (
              <TabsContent key={type} value={type} className="p-4">
                <FilterSort
                  options={filterOptions}
                  onChange={setFilterOptions}
                  type={type as "galleries" | "videos" | "images"}
                />
                <LibraryTabsContent
                  type={type as "galleries" | "videos" | "images"}
                  filterOptions={filterOptions}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Library;