"use client";

import { useEffect, useState } from "react";

type SectionNavProps = {
  items: string[];
};

export function SectionNav({ items }: SectionNavProps) {
  const [active, setActive] = useState(items[0]);

  useEffect(() => {
    const scroller = document.querySelector(".site-shell");
    if (!scroller) return;

    const onScroll = () => {
      const scrollTop = scroller.scrollTop;
      const scrollerTop = scroller.getBoundingClientRect().top;
      let next = items[0];

      for (const item of items) {
        const section = document.getElementById(item.toLowerCase());
        const sectionTop = section
          ? scrollTop + section.getBoundingClientRect().top - scrollerTop
          : 0;

        if (section && sectionTop - 280 <= scrollTop) {
          next = item;
        }
      }

      setActive(next);
    };

    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [items]);

  return (
    <aside className="section-nav">
      {items.map((item) => (
        <a
          className={active === item ? "active" : ""}
          href={`#${item.toLowerCase()}`}
          key={item}
        >
          {item.toUpperCase()}
        </a>
      ))}
    </aside>
  );
}
