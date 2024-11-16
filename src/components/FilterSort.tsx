import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FilterSortOptions {
  maxVideos?: number;
  maxImages?: number;
  sortBy: "videos-asc" | "videos-desc" | "images-asc" | "images-desc" | "date";
}

interface FilterSortProps {
  options: FilterSortOptions;
  onChange: (options: FilterSortOptions) => void;
}

const FilterSort = ({ options, onChange }: FilterSortProps) => {
  const handleSortChange = (value: FilterSortOptions["sortBy"]) => {
    onChange({ ...options, sortBy: value });
  };

  const handleMaxVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    onChange({ ...options, maxVideos: value });
  };

  const handleMaxImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    onChange({ ...options, maxImages: value });
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxVideos">Maximum Videos</Label>
          <Input
            id="maxVideos"
            type="number"
            min="0"
            value={options.maxVideos || ""}
            onChange={handleMaxVideosChange}
            placeholder="No limit"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxImages">Maximum Images</Label>
          <Input
            id="maxImages"
            type="number"
            min="0"
            value={options.maxImages || ""}
            onChange={handleMaxImagesChange}
            placeholder="No limit"
          />
        </div>
        <div className="space-y-2">
          <Label>Sort By</Label>
          <Select value={options.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (Newest First)</SelectItem>
              <SelectItem value="videos-desc"># of Videos (High to Low)</SelectItem>
              <SelectItem value="videos-asc"># of Videos (Low to High)</SelectItem>
              <SelectItem value="images-desc"># of Images (High to Low)</SelectItem>
              <SelectItem value="images-asc"># of Images (Low to High)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FilterSort;