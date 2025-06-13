"use client";

import { useEffect, useState, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDownIcon } from "lucide-react";

interface ScrollToBottomButtonProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export function ScrollToBottomButton({
  containerRef,
}: ScrollToBottomButtonProps) {
  const [showScrollButton, setShowScrollButton] = useState(false);

  const checkScrollPosition = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Show button when not at the bottom (with a small buffer of 100px)
    setShowScrollButton(distanceFromBottom > 100);
  };

  const scrollToBottom = () => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial check
    checkScrollPosition();

    // Add scroll event listener
    container.addEventListener("scroll", checkScrollPosition);

    // Remove listener on cleanup
    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
    };
  }, [containerRef]);

  if (!showScrollButton) {
    return null;
  }

  return (
    <div className="bottom-38 left-1/2 transform -translate-x-1/2 z-20">
      <Button
        onClick={scrollToBottom}
        className="rounded-full px-4 py-2 shadow-lg bg-card/50 backdrop-blur-lg text-primary hover:bg-card/80 border cursor-pointer transition-all flex items-center gap-2"
      >
        <ArrowDownIcon className="w-4 h-4" />
        <span>Scroll to bottom</span>
      </Button>
    </div>
  );
}
