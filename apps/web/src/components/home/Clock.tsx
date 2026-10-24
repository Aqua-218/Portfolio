"use client";

import { useEffect, useState } from "react";
import * as s from "./home.css";

/** 栃木の現在時刻。1秒ごとに進む。 */
export function Clock({
  location,
  timezone,
}: {
  location: string;
  timezone: string;
}) {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => {
      setTime(fmt.format(new Date()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
    };
  }, [timezone]);

  return (
    <span className={s.clock} aria-label="栃木の現在時刻">
      <span className={s.pip} aria-hidden="true" />
      {location} <span data-time>{time}</span>
      <span className={s.tz}>JST</span>
    </span>
  );
}
