"use client";

import { useEffect, useState } from "react";
import { SearchableSelect, type Option } from "./SearchableSelect";

type FieldErrors = Partial<Record<"districtId" | "thanaId" | "postOfficeId" | "addressDetails" | "postalCode", string>>;

function useOptions(type: "districts" | "thanas" | "postOffices", parentId?: number) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const needsParent = type !== "districts";

  useEffect(() => {
    setOptions([]);
    if (needsParent && !parentId) return;
    const ctrl = new AbortController();
    const qs = new URLSearchParams({ type });
    if (parentId) qs.set("parentId", String(parentId));
    setLoading(true);
    setFailed(false);
    fetch(`/api/locations?${qs}`, { signal: ctrl.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Option[]>) : Promise.reject(new Error("load"))))
      .then(setOptions)
      .catch((e: Error) => { if (e.name !== "AbortError") setFailed(true); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [type, parentId, needsParent]);

  return { options, loading, failed };
}

export function AddressFields({
  districtFieldName = "district",
  onDistrictChange,
  errors = {},
}: {
  /** Name of the field your checkout action already reads the district from */
  districtFieldName?: string;
  /** Called with the English district name, e.g. to refresh the delivery charge */
  onDistrictChange?: (districtName: string) => void;
  errors?: FieldErrors;
}) {
  const [district, setDistrict] = useState<Option | null>(null);
  const [thana, setThana] = useState<Option | null>(null);
  const [postOffice, setPostOffice] = useState<Option | null>(null);
  const [postalCode, setPostalCode] = useState("");

  const districts = useOptions("districts");
  const thanas = useOptions("thanas", district?.id);
  const postOffices = useOptions("postOffices", thana?.id);
  const failed = districts.failed || thanas.failed || postOffices.failed;

  const field =
    "font-bn w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#12392f] focus:ring-2 focus:ring-[#12392f]/15";

  return (
    <div className="space-y-4">
      {failed && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not load locations. Please check your connection and refresh the page.
        </p>
      )}

      {/* Values sent with the form */}
      <input type="hidden" name="districtId" value={district?.id ?? ""} />
      <input type="hidden" name="thanaId" value={thana?.id ?? ""} />
      <input type="hidden" name="postOfficeId" value={postOffice?.id ?? ""} />
      <input type="hidden" name={districtFieldName} value={district?.name ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <SearchableSelect
          label="District (জেলা)"
          requiredMessage="Please select your district from the list"
          options={districts.options}
          loading={districts.loading}
          value={district}
          error={errors.districtId}
          onChange={(o) => {
            setDistrict(o);
            setThana(null);
            setPostOffice(null);
            setPostalCode("");
            onDistrictChange?.(o?.name ?? "");
          }}
        />
        <SearchableSelect
          label="Thana / Upazila (থানা/উপজেলা)"
          requiredMessage="Please select your thana from the list"
          options={thanas.options}
          loading={thanas.loading}
          disabled={!district}
          placeholder={district ? "Type to search…" : "Select a district first"}
          value={thana}
          error={errors.thanaId}
          onChange={(o) => {
            setThana(o);
            setPostOffice(null);
            setPostalCode("");
          }}
        />
        <SearchableSelect
          label="Post Office (পোস্ট অফিস)"
          requiredMessage="Please select your post office from the list"
          options={postOffices.options}
          loading={postOffices.loading}
          disabled={!thana}
          placeholder={thana ? "Type to search…" : "Select a thana first"}
          value={postOffice}
          error={errors.postOfficeId}
          onChange={(o) => {
            setPostOffice(o);
            setPostalCode(o?.hint ?? "");
          }}
        />
        <div>
          <label htmlFor="postalCode" className="font-bn mb-1 block text-sm font-medium text-stone-800">
            Postal Code (পোস্ট কোড) <span className="font-normal text-stone-400">optional</span>
          </label>
          <input
            id="postalCode"
            name="postalCode"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            title="4 digits"
            placeholder="e.g. 1209"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className={`${field} ${errors.postalCode ? "border-red-500" : "border-stone-300"}`}
          />
          {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="addressDetails" className="font-bn mb-1 block text-sm font-medium text-stone-800">
          Village / Area / House (গ্রাম / এলাকা / বাসা) <span className="text-red-600">*</span>
        </label>
        <textarea
          id="addressDetails"
          name="addressDetails"
          required
          minLength={5}
          maxLength={255}
          rows={3}
          placeholder="House no, road, village or area"
          className={`${field} ${errors.addressDetails ? "border-red-500" : "border-stone-300"}`}
        />
        {errors.addressDetails && <p className="mt-1 text-xs text-red-600">{errors.addressDetails}</p>}
      </div>
    </div>
  );
}
