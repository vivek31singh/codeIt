"use client";
import dynamic from "next/dynamic";

const WaitingRoom = dynamic(() => import("./WaitingRoom"), {
  ssr: false,
});


const Page = () => {
return (
  <WaitingRoom/>
)
};

export default Page;
