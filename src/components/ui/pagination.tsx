import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const linkBase =
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50 disabled:pointer-events-none";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<"a">;

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={cn(
        linkBase,
        "h-9 w-9",
        isActive
          ? "border border-[#3b879c] text-[#3b879c] font-semibold bg-white"
          : "hover:bg-black/5 text-gray-700",
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      aria-label="Ir a página anterior"
      className={cn(
        linkBase,
        "h-9 gap-1 px-3 text-gray-700 hover:bg-black/5",
        className
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Anterior</span>
    </a>
  );
}

function PaginationNext({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      aria-label="Ir a página siguiente"
      className={cn(
        linkBase,
        "h-9 gap-1 px-3 text-gray-700 hover:bg-black/5",
        className
      )}
      {...props}
    >
      <span>Siguiente</span>
      <ChevronRight className="h-4 w-4" />
    </a>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("flex h-9 w-9 items-center justify-center text-gray-400", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Más páginas</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
