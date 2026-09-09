import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSearch } from "./table-search";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  searchKey?: string;
}

function getSearchText(item: any): string {
  return Object.entries(item)
    .map(([_, v]) => {
      if (v === null || v === undefined) return "";
      if (typeof v === "object") {
        if ("name" in v && typeof (v as any).name === "string") return (v as any).name;
        if ("title" in v && typeof (v as any).title === "string") return (v as any).title;
        return "";
      }
      return String(v);
    })
    .join(" ")
    .toLowerCase();
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  searchKey,
}: DataTableProps<T>) {
  const isSearchable = searchable || Boolean(searchKey) || (searchPlaceholder !== "Search..." && Boolean(searchPlaceholder));

  const tableContent = (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            <>
              {data.map((item, i) => (
                <TableRow
                  key={item.id || i}
                  data-search-row={getSearchText(item)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(item) : item[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow data-no-results style={{ display: "none" }}>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No matching records found.
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isSearchable) {
    return (
      <TableSearch placeholder={searchPlaceholder} emptyMessage={emptyMessage}>
        {tableContent}
      </TableSearch>
    );
  }

  return tableContent;
}
