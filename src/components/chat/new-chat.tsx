"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";

export function NewChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <MessageCircle className="h-16 w-16 mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Start a new chat</h1>
        <p className="text-muted-foreground">
          Begin your conversation with our AI assistant. Ask questions, get help
          with tasks, or just chat.
        </p>
        <div className="border rounded-lg p-4 bg-background">
          <form className="flex flex-col space-y-4">
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Type your message here..."
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Send message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
