import { memo, useState, useEffect } from "react";
import MemoizedMarkdown from "./MemoizedMarkdown";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

function PureMessageReasoning({
  reasoning,
  id,
}: {
  reasoning: string;
  id: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  console.log(
    `MessageReasoning component for ${id} - Received reasoning:`,
    reasoning
  );

  // Don't render empty reasoning
  if (!reasoning || reasoning.trim() === "") {
    console.warn(`MessageReasoning ${id} - Empty reasoning content detected`);
    return null;
  }

  return (
    <div className="flex flex-col gap-2 pb-2 max-w-3xl w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-muted-foreground cursor-pointer"
      >
        {isExpanded ? (
          <span>
            <ChevronUpIcon className="w-4 h-4" />
          </span>
        ) : (
          <span>
            <ChevronDownIcon className="w-4 h-4" />
          </span>
        )}
        <span>Reasoning</span>
      </button>
      {isExpanded && (
        <div className="p-4 rounded-md bg-secondary/10 text-xs border">
          <MemoizedMarkdown content={reasoning} id={id} size="small" />
        </div>
      )}
    </div>
  );
}

export default memo(PureMessageReasoning, (prev, next) => {
  return prev.reasoning === next.reasoning && prev.id === next.id;
});
