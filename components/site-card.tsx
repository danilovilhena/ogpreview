'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import MemoizedImage from './site-card/memoized-image';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SiteCard({ siteData }: { siteData: any }) {
  const ogData = siteData?.openGraph || {};
  const basicData = siteData?.basic || {};
  const twitterData = siteData?.twitter || {};
  const site = siteData?.site || {};
  const siteUrl = site?.url || site?.domain?.domain;

  const title = site?.title || ogData?.site_name || ogData?.title || basicData?.title;
  const ogImage = ogData?.images?.[0] || twitterData?.images?.[0];
  const faviconUrl = basicData?.favicon || `https://www.google.com/s2/favicons?domain=${siteUrl}&sz=32`;

  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (titleRef.current) {
      const element = titleRef.current;
      setIsTitleTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [title]);

  const titleElement = (
    <h3 ref={titleRef} className="font-medium text-gray-900 truncate flex-1">
      {title}
    </h3>
  );

  return (
    <TooltipProvider>
      <div className="block relative group" onMouseEnter={() => setShowButton(true)} onMouseLeave={() => setShowButton(false)}>
        {/* Full width OG Image or Placeholder */}
        <div className="relative w-full">
          <MemoizedImage ogImage={ogImage} title={title} imageError={imageError} setImageError={setImageError} />

          {/* Animated Arrow Link */}
          <AnimatePresence>
            {showButton && (
              <motion.a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                className="absolute top-2 right-2 p-1 bg-neutral-100 rounded-sm hover:bg-neutral-200 transition-colors z-10 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-gray-600" />
              </motion.a>
            )}
          </AnimatePresence>
        </div>

        {/* Favicon and Title below image */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative size-5 flex-shrink-0">
            <Image
              src={faviconUrl}
              alt={`${title} favicon`}
              width={24}
              height={24}
              className="rounded"
              onError={(e) => {
                // Fallback if favicon fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          {isTitleTruncated ? (
            <Tooltip>
              <TooltipTrigger asChild>{titleElement}</TooltipTrigger>
              <TooltipContent>
                <p>{title}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            titleElement
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
