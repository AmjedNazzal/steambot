"use client";

import Chat from "./components/chat";

export default function Home() {
  return (
    <main
      style={{ background: "#1b2838" }}
      className="flex min-h-screen flex-col items-center justify-between"
    >
      <div
        style={{
          background:
            "linear-gradient(to bottom, rgba(42, 71, 94, 1.0) 5%, rgba(42, 71, 94, 0.0) 70%)",
        }}
        className="flex h-full min-h-screen w-full gap-2 flex-col items-center justify-between p-10"
      >
        <div className="flex w-full justify-center relative">
          <img
            className="flex w-[70px] absolute left-0"
            src="steambot-logo.png"
          ></img>
          <h1 className="text-[#b5b5b5] text-[35px] font-bold tracking-widest leading-loose ">
            STEAMbot
          </h1>
        </div>
        <Chat />
      </div>
    </main>
  );
}
