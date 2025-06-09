"use client";

import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

type MessageType = "user" | "assistant";

interface Message {
  id: string;
  type: MessageType;
  content: string | React.ReactNode;
  timestamp: Date;
}

function copyToClipboard(text: string, setCopied: (copied: boolean) => void) {
  if (navigator && navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard!", { duration: 1000 });
        setCopied(true);
        setTimeout(() => setCopied(false), 4000);
      })
      .catch((err) => {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand("copy");
          toast.success("Copied to clipboard!");
          setCopied(true);
          setTimeout(() => setCopied(false), 4000);
        } catch (e) {
          toast.error("Failed to copy.");
          setCopied(false);
        }
        document.body.removeChild(textarea);
      });
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      toast.success("Copied to clipboard!", { duration: 1000 });
    } catch (e) {
      toast.error("Failed to copy.");
    }
    document.body.removeChild(textarea);
  }
}

// Python code for binary tree inversion
const pythonCode = `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def invertTree(root: TreeNode) -> TreeNode:
    """
    Inverts a binary tree.
    
    Args:
        root: The root of the binary tree.
        
    Returns:
        The root of the inverted binary tree.
    """
    if root is None:
        return None
        
    # Swap the left and right children
    temp = root.left
    root.left = root.right
    root.right = temp
    
    # Recursively invert the left and right subtrees
    invertTree(root.left)
    invertTree(root.right)
    
    return root

# --- Example Usage ---

# Helper function to print the tree (in-order traversal)
def print_tree_inorder(node):
    if node:
        print_tree_inorder(node.left)
        print(node.val, end=" ")
        print_tree_inorder(node.right)`;

const mockMessages: Message[] = [
  {
    id: "1",
    type: "user",
    content: "Write code to invert a binary search tree in Python",
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: "2",
    type: "assistant",
    content: (
      <div className="space-y-4">
        <p>
          To invert a binary search tree (sometimes called mirroring), you need
          to swap the left and right children for every node in the tree. Here's
          a Python implementation:
        </p>
        <div className="relative rounded-md bg-[#1e1e1e] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-1 bg-[#2a2a2a] text-sm text-gray-300">
            <span>python</span>
            <CopyButton code={pythonCode} />
          </div>
          <SyntaxHighlighter
            language="python"
            style={oneDark}
            customStyle={{ margin: 0, padding: "1rem" }}
          >
            {pythonCode}
          </SyntaxHighlighter>
        </div>
        <p>
          This implementation uses a simple recursive approach to swap the left
          and right children of each node, starting from the root and working
          down the tree. The time complexity is O(n) where n is the number of
          nodes in the tree, as we visit each node exactly once.
        </p>
      </div>
    ),
    timestamp: new Date(Date.now() - 590000),
  },
];
export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => copyToClipboard(code, setCopied)}
      onMouseLeave={() => setCopied(false)}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

export default function Messages() {
  return (
    <div className="flex flex-col space-y-4 py-4 overflow-y-auto h-full">
      {mockMessages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.type === "user" ? "justify-end" : "justify-start"
          } px-4`}
        >
          <div
            className={`flex ${
              message.type === "user" ? "bg-card" : "bg-card border"
            } rounded-lg overflow-hidden`}
          >
            <div className="py-4 px-4">
              {typeof message.content === "string" ? (
                <p className="text-sm">{message.content}</p>
              ) : (
                message.content
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
