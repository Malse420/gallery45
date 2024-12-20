import React from "react";
import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface FilterSortOptions {
  maxVideos?: number;
  minVideos?: number;
  maxImages?: number;
  minImages?: number;
  minDuration?: number;
  maxDuration?: number;
  minFileSize?: number;
  maxFileSize?: number;
  sortBy: "videos-asc" | "videos-desc" | "images-asc" | "images-desc" | "date" | "size-asc" | "size-desc" | "duration-asc" | "duration-desc";
}

interface FilterSortProps {
  options: FilterSortOptions;
  onChange: (options: FilterSortOptions) => void;
  type: "galleries" | "videos" | "images";
}

const FilterSort = ({ options, onChange, type }: FilterSortProps) => {
  const handleSortChange = (value: FilterSortOptions["sortBy"]) => {
    onChange({ ...options, sortBy: value });
  };

  const handleInputChange = (field: keyof FilterSortOptions, value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    onChange({ ...options, [field]: numValue });
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      <Select value={options.sortBy} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Date (Newest First)</SelectItem>
          {(type === "galleries" || type === "videos") && (
            <>
              <SelectItem value="videos-desc"># of Videos (High to Low)</SelectItem>
              <SelectItem value="videos-asc"># of Videos (Low to High)</SelectItem>
              <SelectItem value="duration-desc">Duration (Long to Short)</SelectItem>
              <SelectItem value="duration-asc">Duration (Short to Long)</SelectItem>
            </>
          )}
          {(type === "galleries" || type === "images") && (
            <>
              <SelectItem value="images-desc"># of Images (High to Low)</SelectItem>
              <SelectItem value="images-asc"># of Images (Low to High)</SelectItem>
            </>
          )}
          {(type === "videos" || type === "images") && (
            <>
              <SelectItem value="size-desc">File Size (Large to Small)</SelectItem>
              <SelectItem value="size-asc">File Size (Small to Large)</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-4">
          <div className="grid grid-cols-1 gap-4">
            {type === "galleries" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="minVideos">Minimum Videos</Label>
                  <Input
                    id="minVideos"
                    type="number"
                    min="0"
                    value={options.minVideos || ""}
                    onChange={(e) => handleInputChange("minVideos", e.target.value)}
                    placeholder="No minimum"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxVideos">Maximum Videos</Label>
                  <Input
                    id="maxVideos"
                    type="number"
                    min="0"
                    value={options.maxVideos || ""}
                    onChange={(e) => handleInputChange("maxVideos", e.target.value)}
                    placeholder="No limit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minImages">Minimum Images</Label>
                  <Input
                    id="minImages"
                    type="number"
                    min="0"
                    value={options.minImages || ""}
                    onChange={(e) => handleInputChange("minImages", e.target.value)}
                    placeholder="No minimum"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxImages">Maximum Images</Label>
                  <Input
                    id="maxImages"
                    type="number"
                    min="0"
                    value={options.maxImages || ""}
                    onChange={(e) => handleInputChange("maxImages", e.target.value)}
                    placeholder="No limit"
                  />
                </div>
              </>
            )}
            
            {(type === "videos" || type === "galleries") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="minDuration">Min Duration (seconds)</Label>
                  <Input
                    id="minDuration"
                    type="number"
                    min="0"
                    value={options.minDuration || ""}
                    onChange={(e) => handleInputChange("minDuration", e.target.value)}
                    placeholder="No minimum"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDuration">Max Duration (seconds)</Label>
                  <Input
                    id="maxDuration"
                    type="number"
                    min="0"
                    value={options.maxDuration || ""}
                    onChange={(e) => handleInputChange("maxDuration", e.target.value)}
                    placeholder="No maximum"
                  />
                </div>
              </>
            )}

            {(type === "images" || type === "videos") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="minFileSize">Min File Size (MB)</Label>
                  <Input
                    id="minFileSize"
                    type="number"
                    min="0"
                    value={options.minFileSize || ""}
                    onChange={(e) => handleInputChange("minFileSize", e.target.value)}
                    placeholder="No minimum"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    min="0"
                    value={options.maxFileSize || ""}
                    onChange={(e) => handleInputChange("maxFileSize", e.target.value)}
                    placeholder="No maximum"
                  />
                </div>
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FilterSort;