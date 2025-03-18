import AddressForm from "@/components/address-form";

export default async function Page() {
  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Address form</h2>
      </div>
      <div>
          <AddressForm />
      </div>
    </div>
  );
}