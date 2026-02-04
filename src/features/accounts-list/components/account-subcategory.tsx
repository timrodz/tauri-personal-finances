import { getSubCategoryRenderOptions } from "@/lib/categories";

interface AccountSubcategoryProps {
  value: string | null;
}

export function AccountSubcategory({ value }: AccountSubcategoryProps) {
  const options = getSubCategoryRenderOptions(value);

  if (!options) return null;

  return (
    <>
      {options.icon && <options.icon className="size-5 mr-1" />}
      {options.label}
    </>
  );
}
