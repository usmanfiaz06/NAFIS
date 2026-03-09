import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "IMPORTER" | "REGULATOR" | "ADMIN";
      companyId: string | null;
      companyName: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "IMPORTER" | "REGULATOR" | "ADMIN";
    companyId: string | null;
    companyName: string | null;
  }
}
