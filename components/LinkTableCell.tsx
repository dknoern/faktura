import Link from "next/link";
import { TableCell } from "./ui/table";
import { cn } from "@/lib/utils";

export function LinkTableCell({
    href,
    children,
    className = "",
    style = {},
  
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  
  }) {
    return (
      <TableCell className={cn("py-3", className)} style={style}>
        <Link href={href} style={{ textDecoration: 'underline' }} className="hover:text-blue-500">
          {children}
        </Link>
      </TableCell>
    );
  }
  