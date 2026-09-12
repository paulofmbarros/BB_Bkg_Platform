import Link from "next/link";
export function CustomerPagination({
  page,
  total,
  path,
  query,
}: {
  page: number;
  total: number;
  path: string;
  query: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / 20));
  const url = (page: number) =>
    `${path}?${new URLSearchParams({ ...query, page: String(page) })}`;
  return (
    <nav className="customer-pagination" aria-label="Pagination">
      <span>
        {total} {total === 1 ? "record" : "records"} · Page {page} of {pages}
      </span>
      <div>
        {page > 1 && (
          <Link className="button secondary" href={url(page - 1)}>
            Previous
          </Link>
        )}
        {page < pages && (
          <Link className="button secondary" href={url(page + 1)}>
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
