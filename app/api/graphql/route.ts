import { NextRequest } from "next/server";
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs } from "./schema";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

interface User {
  id: string;
  email: string;
  profileImg: string;
  fullName: string;
}

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

const resolvers = {
  Query: {
    Users: async (): Promise<User[]> => {
      return [
        {
          id: "id",
          email: "email",
          profileImg: "profileImg",
          fullName: "fullName",
        },
      ];
    },
  },

  Mutation: {
    createUser: async (
      _: unknown,
      args: User
    ): Promise<(User & { message: string }) | { error: string }> => {

      if (!args) return { error: "No arguments received" };

      const { email, profileImg, fullName } = args || {};
      
      if (!email) return { error: "Email is required" };

      try {
        const userExists = await prisma.user.findUnique({
          where: { email: email },
        });

        if (userExists) {
          return {
            id: userExists.id,
            email: userExists.email,
            profileImg: userExists.profileImg ?? "",
            fullName: userExists.fullName ?? "",
            message: `Welcome back! ${userExists.fullName}, You're already part of our community. We're thrilled to see you again!`,
          };
        }

        const user = await prisma.user.create({
          data: { email, profileImg, fullName },
        });

        return {
          id: user.id,
          email: user.email,
          profileImg: user.profileImg ?? "",
          fullName: user.fullName ?? "",
          message: `Signed up successfully! ${user.fullName}, we are glad to have you on board!`,
        };
      } catch (error) {
        console.error("An error occurred while creating the user:", error);
        return { error: "Internal server error" };
      }
    },

    runCode: async (
      _: unknown,
      args: { id: string; language: string; code: string }
    ): Promise<{ output?: string; error?: string }> => {
      const { id, language, code } = args;

      const supportedLanguages: Record<string, string> = {
        python: "py",
        javascript: "js",
        typescript: "ts",
      };

      if (!id) return { error: "User ID is required" };
      if (!language || !code)
        return { error: "Language and code are required" };
      if (!supportedLanguages[language])
        return { error: "Language not supported" };

      try {
        const ext = supportedLanguages[language];



        const filename = `user_script.${ext}`;
        const filePath = path.resolve(
          process.cwd(),
          "code-runner",
          language,
          filename
        );

        fs.writeFileSync(filePath, code);

        // const dockerCommand = `docker run --rm -v ${path.dirname(
        //   filePath
        // )}:/usr/src/app ${language}-runner node /usr/src/app/${filename}`;

        const runCommands: Record<string, string> = {
          python: "python3",
          javascript: "node",
          typescript: "npx tsc user_script.ts && node ./code-runner/typescript/user_script.js",
        };
        
        const command = runCommands[language];
        if (!command) return { error: "Unsupported language" };


        const dockerCommand = `docker run --rm -v ${path.dirname(filePath)}:/usr/src/app ${language}-runner ${command} /usr/src/app/${filename}`;

        return new Promise((resolve) => {
          exec(dockerCommand, async (error, stdout, stderr) => {
            if (error) {
              resolve({ error: stderr.trim() || "Execution error" });
              return;
            }

            try {
              // --------------------------------
              // come up with better approach
              // --------------------------------
              // await prisma.code.create({
              //   data: { code, language, authorId: id },
              // });

              resolve({ output: stdout });
            } catch (dbError) {
              const error = dbError as Error;
              resolve({ error: "Database error: " + error.message });
            }
          });
        });
      } catch (error) {
        const Error = error as Error;
        return { error: "Error running code: " + Error.message };
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => ({ req }),
});

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
export async function PUT(req: NextRequest) {
  return handler(req);
}
export async function PATCH(req: NextRequest) {
  return handler(req);
}
export async function DELETE(req: NextRequest) {
  return handler(req);
}
