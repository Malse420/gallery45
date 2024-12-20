import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface DownloadStatus {
  id: string;
  progress: number;
  filename: string;
  status: "downloading" | "completed" | "error";
}

const DownloadProgress = () => {
  const [downloads, setDownloads] = useState<DownloadStatus[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const pollProgress = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('progress', {
          method: 'GET'
        });
        
        if (error) {
          console.error('Error fetching progress:', error);
          return;
        }
        
        setDownloads(data || []);
      } catch (err) {
        console.error('Error polling progress:', err);
      }
    }, 1000);

    return () => clearInterval(pollProgress);
  }, []);

  if (downloads.length === 0) return null;

  return (
    <div
      className={`fixed bottom-0 right-0 left-0 transition-all duration-300 ease-in-out bg-background/50 backdrop-blur-sm border-t border-border shadow-lg ${
        isExpanded ? "h-[50vh]" : "h-14"
      }`}
    >
      <div className="container mx-auto relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>

        <Tabs defaultValue="active" className="w-full h-full">
          <TabsList className="h-14 w-full grid grid-cols-2">
            <TabsTrigger value="active">
              Active Downloads ({downloads.filter(d => d.status === "downloading").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({downloads.filter(d => d.status === "completed").length})
            </TabsTrigger>
          </TabsList>

          <div className={`overflow-auto ${isExpanded ? "h-[calc(50vh-3.5rem)]" : "h-0"}`}>
            <TabsContent value="active" className="p-4 space-y-2">
              {downloads
                .filter((d) => d.status === "downloading")
                .map((download) => (
                  <Card key={download.id} className="p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium truncate">
                        {download.filename}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {download.progress}%
                      </span>
                    </div>
                    <Progress value={download.progress} className="h-2" />
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="completed" className="p-4 space-y-2">
              {downloads
                .filter((d) => d.status === "completed")
                .map((download) => (
                  <Card key={download.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate">
                        {download.filename}
                      </span>
                      <span className="text-sm text-green-500">Completed</span>
                    </div>
                  </Card>
                ))}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default DownloadProgress;