"use client";

import * as React from "react";

import Navigator from "./navigator";
import Messages from "./messages";
import InputComponent from "./input";

export function ChatDetail() {
  return (
    <div className="flex flex-col h-full justify-center items-center overflow-hidden">
      <div className="w-full h-full flex flex-col max-w-4xl relative">
        <div className="px-4 pt-4 pb-4">
          <Navigator />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-36">
          <Messages />
        </div>
        <InputComponent />
      </div>
    </div>
  );
}
