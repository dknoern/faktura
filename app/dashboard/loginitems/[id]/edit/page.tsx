import { notFound } from 'next/navigation';
import { fetchLogItemById } from '@/lib/data';
import { LogForm } from '@/components/logs/form';
import { ImageGallery } from '@/components/products/image-gallery';
import { getProductImages } from '@/lib/utils/productImages';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const [logitem, images] = await Promise.all([
    fetchLogItemById(id),
    getProductImages(id)
  ]);

  if (!logitem) {
    notFound();
  }

  return (
    <div className="container mx-auto py-1">
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Log</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2">
              Action
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href="#images">Add Images</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/dashboard/loginitems/${id}/print`}>Print</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-8">
        <LogForm log={JSON.parse(JSON.stringify(logitem))} />
        <ImageGallery images={images} />
      </div>
    </div>
  );
}

