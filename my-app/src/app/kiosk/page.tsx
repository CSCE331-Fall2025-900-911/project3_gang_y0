import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function Kiosk() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      {session ? <p>Welcome {session.user?.name}</p> : <p>Not logged in</p>}
    </div>
  );
}
