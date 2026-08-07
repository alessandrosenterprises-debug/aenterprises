export function generateBreadcrumbs(pathname: string) {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => ({
      label: segment.replace(/-/g, " "),
      href: "/" + segment,
    }));
}