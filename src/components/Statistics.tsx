import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

const Statistics = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: stats } = useQuery({
    queryKey: ["gallery-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cached_galleries")
        .select("video_count, image_count, total_duration, total_size_bytes")
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const averages = stats?.reduce(
    (acc, item) => ({
      videos: acc.videos + (item.video_count || 0),
      images: acc.images + (item.image_count || 0),
      duration: acc.duration + (item.total_duration || 0),
      size: acc.size + (item.total_size_bytes || 0),
      count: acc.count + 1,
    }),
    { videos: 0, images: 0, duration: 0, size: 0, count: 0 }
  );

  const chartData = stats?.map((item) => ({
    name: "Gallery",
    videos: item.video_count || 0,
    images: item.image_count || 0,
    size: Math.round((item.total_size_bytes || 0) / (1024 * 1024)),
  }));

  return (
    <div className="fixed top-4 left-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all"
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 w-[calc(100vw-2rem)] max-w-3xl animate-slide-in-right">
          <div className="space-y-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg shadow-lg">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {averages ? Math.round(averages.videos / averages.count) : 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {averages ? Math.round(averages.images / averages.count) : 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {averages ? `${Math.floor((averages.duration / averages.count) / 60)}m` : "N/A"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {averages
                      ? `${Math.round((averages.size / averages.count) / (1024 * 1024))}MB`
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Content Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="videos" fill="#FF4785" name="Videos" />
                    <Bar dataKey="images" fill="#1EA7FD" name="Images" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default Statistics;