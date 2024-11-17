import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GalleryExtractor = () => {
  const [url, setUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a gallery URL",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-gallery", {
        body: { url: url.trim() }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Gallery data extracted successfully",
      });

      // Clear the input
      setUrl("");
    } catch (error) {
      console.error("Extraction error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to extract gallery data",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Enter gallery URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={handleExtract}
          disabled={isExtracting}
        >
          {isExtracting ? "Extracting..." : "Extract"}
        </Button>
      </div>
    </div>
  );
};

export default GalleryExtractor;