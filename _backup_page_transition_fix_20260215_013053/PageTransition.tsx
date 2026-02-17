"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

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

  const prevPathRef = useRef<string | null>(null);
  const prevGroupRef = useRef<Group>(groupOf(pathname));

  const dir = useMemo(() => {
    if (!prevPathRef.current) return 0;

    const prev = prevGroupRef.current;
    const next = groupOf(pathname);

    if (prev !== next) {
      return prev === "stays" && next === "board" ? 1 : -1;
    }

    return 0;
  }, [pathname]);

  useEffect(() => {
    prevPathRef.current = pathname;
    prevGroupRef.current = groupOf(pathname);
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
