export function getCompactPagination(currentPage, pageCount) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set([1, pageCount]);
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(pageCount - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.add(page);
  }

  const sortedPages = [...pages].sort((left, right) => left - right);
  const compactPages = [];

  sortedPages.forEach((page, index) => {
    const previous = sortedPages[index - 1];

    if (previous && page - previous > 1) {
      compactPages.push(`ellipsis-${previous}-${page}`);
    }

    compactPages.push(page);
  });

  return compactPages;
}
