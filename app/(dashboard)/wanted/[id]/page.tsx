import { redirect } from 'next/navigation';

type Params = Promise<{ id: string }>

export default async function WantedPage({ params }: { params: Params }) {
  const { id } = await params;
  
  // For existing wanted items, redirect to view page
  if (id !== 'new') {
    redirect(`/wanted/${id}/view`);
  }
  
  // For new wanted items, redirect to new page
  redirect('/wanted/new');
}
