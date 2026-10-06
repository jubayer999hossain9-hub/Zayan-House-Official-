import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bdDistricts, bdThanas, bdPostOffices } from "@/db/schema-home";

export const addressSchema = z.object({
  districtId: z.coerce.number().int().positive("Please select a district (জেলা)"),
  thanaId: z.coerce.number().int().positive("Please select a thana / upazila (থানা)"),
  postOfficeId: z.coerce.number().int().positive("Please select a post office (পোস্ট অফিস)"),
  addressDetails: z
    .string()
    .trim()
    .min(5, "Please enter your village / area / house details")
    .max(255, "Address details are too long"),
  postalCode: z.string().trim().regex(/^\d{4}$/, "Postal code must be 4 digits").or(z.literal("")),
});

type AddressErrors = Partial<Record<keyof z.infer<typeof addressSchema>, string>>;

export type ResolvedAddress = {
  district: string;      // English name, e.g. "Dhaka"
  thana: string;
  postOffice: string;
  postalCode: string;    // "" when not given
  details: string;
  fullAddress: string;   // one line, ready for your existing address column
};

export async function resolveAddressFromForm(
  formData: FormData
): Promise<{ ok: true; address: ResolvedAddress } | { ok: false; errors: AddressErrors }> {
  const text = (k: string) => String(formData.get(k) ?? "");
  const parsed = addressSchema.safeParse({
    districtId: text("districtId"),
    thanaId: text("thanaId"),
    postOfficeId: text("postOfficeId"),
    addressDetails: text("addressDetails"),
    postalCode: text("postalCode"),
  });

  if (!parsed.success) {
    const errors: AddressErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof AddressErrors;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  const a = parsed.data;

  // One query proves the post office is in the thana and the thana is in the district
  const [row] = await db
    .select({ district: bdDistricts.name, thana: bdThanas.name, postOffice: bdPostOffices.name })
    .from(bdPostOffices)
    .innerJoin(bdThanas, eq(bdPostOffices.thanaId, bdThanas.id))
    .innerJoin(bdDistricts, eq(bdThanas.districtId, bdDistricts.id))
    .where(
      and(
        eq(bdPostOffices.id, a.postOfficeId),
        eq(bdThanas.id, a.thanaId),
        eq(bdDistricts.id, a.districtId)
      )
    )
    .limit(1);

  if (!row) {
    return { ok: false, errors: { postOfficeId: "Selected location is not valid. Please choose again." } };
  }

  const office = a.postalCode ? `${row.postOffice}-${a.postalCode}` : row.postOffice;
  return {
    ok: true,
    address: {
      district: row.district,
      thana: row.thana,
      postOffice: row.postOffice,
      postalCode: a.postalCode,
      details: a.addressDetails,
      fullAddress: `${a.addressDetails}, P.O. ${office}, ${row.thana}, ${row.district}`,
    },
  };
}
