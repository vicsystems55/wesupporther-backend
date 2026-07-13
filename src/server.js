import "dotenv/config";
import app from "./app.js";
import prisma from "./config/database.js";


const PORT=process.env.PORT || 3000;



const server = app.listen(PORT, () => {

console.log(
`Server running on port ${PORT}`
);

});

const shutdown = (signal) => {
  console.log(`${signal} received; closing server`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
