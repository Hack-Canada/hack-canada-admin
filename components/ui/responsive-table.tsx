"use client";

import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

const ResponsiveTable = ({ children, className }: Props) => {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md",
        "-mx-4 md:mx-0",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default ResponsiveTable;
