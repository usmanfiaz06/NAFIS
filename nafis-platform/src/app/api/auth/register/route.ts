import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, role, companyName, companyCountry } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let companyId: string | undefined;
    if (companyName) {
      const company = await prisma.company.create({
        data: {
          name: companyName,
          type: role === "IMPORTER" ? "IMPORTER" : "SUPPLIER",
          country: companyCountry || "SA",
        },
      });
      companyId = company.id;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || "IMPORTER",
        companyId,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
