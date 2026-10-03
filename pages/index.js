import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";

export default function Home() {
  return null;
}

export async function getServerSideProps({ req, res }) {
  const session = await getServerSession(req, res, authOptions);
  return {
    redirect: {
      destination: session ? "/app/cashflow" : "/sign-in",
      permanent: false,
    },
  };
}
