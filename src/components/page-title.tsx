import { PropsWithChildren } from "react";

export function PageTitle({ children }: PropsWithChildren) {
  return <h1 className="text-xl font-semibold mb-4">{children}</h1>;
}
