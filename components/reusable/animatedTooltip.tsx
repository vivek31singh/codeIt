import Image from "next/image";
import React from "react";

export interface Entity {
  fullname: string;
  profileImg: string;
  socketId: string;
  userId: string;
}

const AnimatedTooltip = ({ data }: { data: Entity[] }) => {
  return (
    <div className="flex -space-x-2 overflow-hidden">
      {data?.length > 0 &&
        data?.map((item, idx) => (
          <Image
            key={item?.userId || idx}
            alt={item?.fullname || "user"}
            src={item?.profileImg || `https://placehold.co/600x400?text=${item?.fullname?.charAt(0) || "U"}`}
            className="inline-block size-10 rounded-full ring-2 ring-white"
            width={600}
            height={600}
          />
        ))}
    </div>
  );
};

export default AnimatedTooltip;
