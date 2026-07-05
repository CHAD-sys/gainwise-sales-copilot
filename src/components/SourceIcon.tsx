import { FileText, BookOpen, MessagesSquare } from "lucide-react";
import type { SourceType } from "../types";

/** Consistent icon language for each source type (single stroke set). */
export function SourceIcon({
  type,
  className = "h-4 w-4",
}: {
  type: SourceType;
  className?: string;
}) {
  switch (type) {
    case "catalog":
      return <BookOpen className={className} strokeWidth={1.75} aria-hidden />;
    case "internal":
      return <FileText className={className} strokeWidth={1.75} aria-hidden />;
    case "wechat":
      return (
        <MessagesSquare className={className} strokeWidth={1.75} aria-hidden />
      );
  }
}
