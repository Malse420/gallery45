import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface DownloadStatus {
  id: string;
  progress: number;
  filename: string;
  status: "downloading" | "completed" | "error";
}

const DownloadProgress = () => {
  const [downloads, setDownloads] = useState<DownloadStatus[]>([]);

  useEffect(() => {
    const pollProgress = setInterval(() => {
      fetch("/api/progress")
        .then((res) => res.json())
        .then((data) => setDownloads(data))
        .catch(console.error);
    }, 1000);

    return () => clearInterval(pollProgress);
  }, []);

  if (downloads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 space-y-2">
      {downloads.map((download) => (
        <Card key={download.id} className="p-4 bg-white shadow-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium truncate">
              {download.filename}
            </span>
            <span className="text-sm text-gray-500">
              {download.progress}%
            </span>
          </div>
          <Progress value={download.progress} className="h-2" />
        </Card>
      ))}
    </div>
  );
};

export default DownloadProgress;