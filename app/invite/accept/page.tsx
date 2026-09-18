import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getVendorInviteInfo } from "@/lib/actions/vendor-invite-actions";
import { AcceptInviteForm } from "./accept-form";

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ vid?: string; token?: string }>;

export default async function AcceptInvitePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const vendorId = params.vid || '';
  const token = params.token || '';

  const invite = vendorId && token
    ? await getVendorInviteInfo(vendorId, token)
    : { status: 'invalid' as const };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      {invite.status === 'valid' ? (
        <AcceptInviteForm
          vendorId={vendorId}
          token={token}
          email={invite.email!}
          firstName={invite.firstName}
          tenantName={invite.tenantName!}
        />
      ) : invite.status === 'accepted' ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation already accepted</CardTitle>
            <CardDescription>
              Your account is already set up. Sign in with your email and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={`/invite/signin${invite.email ? `?email=${encodeURIComponent(invite.email)}` : ''}`}>
                Sign in
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : invite.status === 'expired' ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation expired</CardTitle>
            <CardDescription>
              This invitation link has expired. Please contact the business that invited you and
              ask them to send a new invitation.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation not found</CardTitle>
            <CardDescription>
              This invitation link is not valid. It may have been replaced by a newer invitation
              email — check your inbox for the most recent one, or contact the business that
              invited you.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </main>
  );
}
