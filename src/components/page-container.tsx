import { PropsWithChildren } from "react";

type PageContainerProps = PropsWithChildren;

export function PageContainer({ children }: PageContainerProps) {
  return <div className="page-container">{children}</div>;
}
