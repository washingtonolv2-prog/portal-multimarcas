"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function toggleDemo() {
  await requireAdmin();
  const jar = await cookies();
  if (jar.get("demo")?.value === "1") {
    jar.delete("demo");
    jar.delete("demo_ack");
  } else {
    jar.set("demo", "1", { path: "/", httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 60 * 8 });
  }
  revalidatePath("/", "layout");
}
