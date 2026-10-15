import "dotenv/config";

const res = await fetch("https://api.groq.com/openai/v1/models", {
  headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
});
const data = (await res.json()) as any;
for (const m of data.data ?? []) console.log(m.id);