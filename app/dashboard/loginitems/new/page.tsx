import { LogForm } from '@/components/logs/form';

export default function Page() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">New Log Item</h2>
      </div>
      <LogForm />
    </div>
  );
} 