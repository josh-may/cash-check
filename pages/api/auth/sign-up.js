export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  return res.status(403).json({ error: "Registration is closed for this personal instance." });
}
