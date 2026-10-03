export default function SignUp() {
  return null;
}

export function getServerSideProps() {
  return { redirect: { destination: "/sign-in", permanent: false } };
}
