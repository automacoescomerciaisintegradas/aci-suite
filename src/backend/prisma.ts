import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PRISMA_UNAVAILABLE_MESSAGE =
    "Prisma indisponivel: execute `prisma generate` com versao compativel para habilitar as rotas de banco.";

function createPrismaUnavailableProxy() {
    return new Proxy(
        {},
        {
            get() {
                return new Proxy(
                    {},
                    {
                        get() {
                            return async () => {
                                throw new Error(PRISMA_UNAVAILABLE_MESSAGE);
                            };
                        }
                    }
                );
            }
        }
    );
}

let prismaInstance: any;

try {
    const { PrismaClient } = require("@prisma/client");
    prismaInstance = new PrismaClient();
} catch (error) {
    console.error("⚠️ Falha ao inicializar Prisma Client.", error);
    prismaInstance = createPrismaUnavailableProxy();
}

export const prisma = prismaInstance;
