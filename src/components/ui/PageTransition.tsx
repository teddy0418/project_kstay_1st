"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Group = "stays" | "board";

function groupOf(pathname: string): Group {
  return pathname.startsWith("/board") ? "board" : "stays";
}

const variants = {
  enter: (dir: number) => {
    if (dir === 0) return { x: 0, opacity: 0 };
    return { x: dir > 0 ? "100%" : "-100%", opacity: 1 };
  },
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => {
    if (dir === 0) return { x: 0, opacity: 0 };
    return { x: dir > 0 ? "-100%" : "100%", opacity: 1 };
  },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState<string | null>(null);
  const [prevGroup, setPrevGroup] = useState<Group>(() => groupOf(pathname));

  const dir = useMemo(() => {
    if (prevPath === null) return 0;
    const next = groupOf(pathname);
    if (prevGroup !== next) {
      return prevGroup === "stays" && next === "board" ? 1 : -1;
    }
    return 0;
  }, [pathname, prevPath, prevGroup]);

  useEffect(() => {
    setPrevPath(pathname);
    setPrevGroup(groupOf(pathname));
  }, [pathname]);

  return (
    <div className="relative w-full overflow-x-hidden">
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={pathname}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", duration: 0.34, ease: "easeOut" }}
          className="w-full will-change-transform"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
