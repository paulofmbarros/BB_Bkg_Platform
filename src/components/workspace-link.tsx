import NextLink from "next/link";
import type { ComponentProps } from "react";

type WorkspaceLinkProps = ComponentProps<typeof NextLink>;

export function WorkspaceLink(props: WorkspaceLinkProps) {
  return <NextLink {...props} prefetch={false} />;
}
