export const DISTRICTS = [
  "Bagerhat","Bandarban","Barguna","Barishal","Bhola","Bogura","Brahmanbaria","Chandpur","Chattogram","Chuadanga",
  "Cox's Bazar","Cumilla","Dhaka","Dinajpur","Faridpur","Feni","Gaibandha","Gazipur","Gopalganj","Habiganj",
  "Jamalpur","Jashore","Jhalokati","Jhenaidah","Joypurhat","Khagrachhari","Khulna","Kishoreganj","Kurigram","Kushtia",
  "Lakshmipur","Lalmonirhat","Madaripur","Magura","Manikganj","Meherpur","Moulvibazar","Munshiganj","Mymensingh","Naogaon",
  "Narail","Narayanganj","Narsingdi","Natore","Netrokona","Nilphamari","Noakhali","Pabna","Panchagarh","Patuakhali",
  "Pirojpur","Rajbari","Rajshahi","Rangamati","Rangpur","Satkhira","Shariatpur","Sherpur","Sirajganj","Sunamganj",
  "Sylhet","Tangail","Thakurgaon",
] as const;

export const INSIDE_DHAKA_SLUG = "inside-dhaka";
export const OUTSIDE_DHAKA_SLUG = "outside-dhaka";

/** Which standard delivery zone a district belongs to. */
export function zoneSlugForDistrict(district: string): string {
  return district.trim().toLowerCase() === "dhaka" ? INSIDE_DHAKA_SLUG : OUTSIDE_DHAKA_SLUG;
}
