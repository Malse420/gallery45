import { Progress } from "@/components/ui/progress";

interface DownloadProgressProps {
  filename: string;
  progress: number;
}

const DownloadProgress = ({ filename, progress }: DownloadProgressProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 truncate">
          {filename}
        </span>
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default DownloadProgress;