import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { LongTailKeywordGenerator } from "@/components/admin/LongTailKeywordGenerator";
import { AutoKeywordProcessor } from "@/components/admin/AutoKeywordProcessor";

export default function SEOKeywords() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>SEO Keywords</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold mb-2">Long-Tail Keyword Management</h1>
        <p className="text-muted-foreground">
          Automatisch systeem dat zichzelf uitbreidt en verbetert op basis van nieuwe content
        </p>
      </div>

      <AutoKeywordProcessor />
      <LongTailKeywordGenerator />
    </div>
  );
}
