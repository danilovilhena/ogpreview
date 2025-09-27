import { Globe } from 'lucide-react';
import Image from 'next/image';
import { memo } from 'react';

const MemoizedImage = memo(
  ({ ogImage, title, imageError, setImageError }: { ogImage: string; title: string; imageError: boolean; setImageError: (error: boolean) => void }) => {
    if (ogImage && !imageError) {
      return (
        <Image
          src={ogImage}
          alt={title || 'Site preview'}
          width={500}
          height={300}
          className="w-full h-auto rounded-md border"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImageError(true)}
        />
      );
    }

    return (
      <div className="w-full h-48 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No preview available</p>
        </div>
      </div>
    );
  },
);

MemoizedImage.displayName = 'MemoizedImage';

export default MemoizedImage;
