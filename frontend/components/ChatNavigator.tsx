"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { memo, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useDataService } from "@/frontend/hooks/useDataService";
import { getMessageSummaries } from "../dexie/queries";
import { RightSidebar } from "@/frontend/components/sidebar/RightSidebar";
import {
  SidebarContent,
  SidebarHeader,
  useSidebarWithSide,
} from "@/components/ui/sidebar";

interface MessageNavigatorProps {
  threadId: string;
  scrollToMessage: (id: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

function PureChatNavigator({
  threadId,
  scrollToMessage,
  isVisible,
  onClose,
}: MessageNavigatorProps) {
  const { dataService, isAuthenticated } = useDataService();
  const [messageSummaries, setMessageSummaries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toggleSidebar } = useSidebarWithSide("right");

  // Get local summaries as a fallback
  const localSummaries = useLiveQuery(
    () => getMessageSummaries(threadId),
    [threadId]
  );

  // Fetch message summaries when thread ID changes, component mounts, or auth state changes
  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setIsLoading(true);

        const summaries = await dataService.getMessageSummaries(threadId);
        setMessageSummaries(summaries);
      } catch (error) {
        console.error("Error fetching message summaries:", error);

        // Fall back to local summaries if available
        if (localSummaries && localSummaries.length > 0) {
          setMessageSummaries(localSummaries);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaries();
  }, [threadId, dataService, isAuthenticated, localSummaries]);

  return (
    <>
      <RightSidebar
        open={isVisible}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) onClose();
        }}
      >
        <div className="flex  items-center justify-between p-4 border-b">
          <h3 className="text-sm font-medium">Chat Navigator</h3>
          <Button
            onClick={() => {
              toggleSidebar();
              onClose();
            }}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Close navigator"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <SidebarContent>
          <div className="flex-1 overflow-hidden p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Loading summaries...
              </div>
            ) : messageSummaries && messageSummaries.length > 0 ? (
              <ul className="flex flex-col gap-2 p-4 prose prose-sm dark:prose-invert list-disc pl-5 h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-full">
                {messageSummaries.map((summary) => (
                  <li
                    key={summary.id}
                    onClick={() => {
                      scrollToMessage(summary.messageId);
                    }}
                    className="cursor-pointer hover:text-foreground transition-colors"
                  >
                    {summary.content.slice(0, 100)}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No summaries available
              </div>
            )}
          </div>
        </SidebarContent>
      </RightSidebar>
    </>
  );
}

export default memo(PureChatNavigator, (prevProps, nextProps) => {
  return (
    prevProps.threadId === nextProps.threadId &&
    prevProps.isVisible === nextProps.isVisible
  );
});
