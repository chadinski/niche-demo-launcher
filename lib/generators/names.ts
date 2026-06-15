import type { BusinessInfo } from "@/lib/types";
import { slugify } from "@/lib/utils";

export function generatedNames(info: BusinessInfo) {
const slug = slugify(info.businessName || "business-demo");

return {
folder: slug || "business-demo",
project: `${slug || "business"}-demo`,
file: "index.html",
};
}
