'use client';

import { useSession } from "next-auth/react";
import { useTranslation } from '@/hooks/useTranslation';

export default function Kiosk() {
  const { data: session } = useSession();
  const welcomeText = useTranslation('Welcome');
  const notLoggedInText = useTranslation('Not logged in');

  return (
    <div>
      {session ? (
        <p>{welcomeText} {session.user?.name}</p>
      ) : (
        <p>{notLoggedInText}</p>
      )}
    </div>
  );
}
