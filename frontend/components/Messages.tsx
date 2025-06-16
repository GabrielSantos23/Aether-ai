import { memo } from "react";
import PreviewMessage from "./Message";
import { UIMessage } from "ai";
import { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import MessageLoading from "../../components/ui/MessageLoading";
import Error from "./Error";

// Define a type for the search source
interface SearchSource {
  title?: string;
  url: string;
  snippet?: string;
}

function PureMessages({
  threadId,
  messages,
  status,
  setMessages,
  reload,
  error,
  stop,
  registerRef,
  searchSources = [],
}: {
  threadId: string;
  messages: UIMessage[];
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  status: UseChatHelpers["status"];
  error: UseChatHelpers["error"];
  stop: UseChatHelpers["stop"];
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  searchSources?: SearchSource[];
}) {
  return (
    <section className="flex flex-col space-y-12">
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          threadId={threadId}
          message={message}
          isStreaming={status === "streaming" && messages.length - 1 === index}
          setMessages={setMessages}
          reload={reload}
          registerRef={registerRef}
          stop={stop}
          searchSources={searchSources}
        />
      ))}
      {status === "submitted" && <MessageLoading />}
      {error && <Error message={error.message} />}
    </section>
  );
}

const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.error !== nextProps.error) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.searchSources, nextProps.searchSources)) return false;
  return true;
});

Messages.displayName = "Messages";

export default Messages;
