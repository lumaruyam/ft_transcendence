import Fastify from 'fastify'
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const fastify = Fastify({
  logger: true
})

const __dirname = path.dirname(fileURLToPath(import.meta.url));

fastify.get('/', async (request, reply) => {
  const html = readFileSync(path.join(__dirname, "public/index.html"), "utf-8");
  reply.type("text/html").send(html);
})

/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()