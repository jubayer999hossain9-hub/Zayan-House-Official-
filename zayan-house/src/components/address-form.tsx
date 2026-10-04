"use client";

import Link from "next/link";
import { useFormAction } from "@/lib/use-form-action";
import { saveAddress } from "@/app/actions/account";
import { DISTRICTS } from "@/lib/districts";

export type AddressValues = {
  id?: number; label: string; fullName: string; phone: string; address: string; area: string | null;
  city: string; district: string; postalCode: string | null; isDefault: boolean;
};

export function AddressForm({ initial, defaults }: { initial?: AddressValues; defaults: { name: string; phone: string } }) {
  const { state, onSubmit, pending } = useFormAction(saveAddress);
  const v = initial;
  const err = (k: string) => state.fieldErrors?.[k];
  const field = (name: string, label: string, value: string, opts: { required?: boolean; type?: string; autoComplete?: string; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={`a-${name}`} className="label">{label}{opts.required && <span className="text-danger"> *</span>}</label>
      <input id={`a-${name}`} name={name} defaultValue={value} type={opts.type ?? "text"} autoComplete={opts.autoComplete} placeholder={opts.placeholder}
        aria-invalid={err(name) ? "true" : undefined} className="field" />
      {err(name) && <p className="field-error">{err(name)}</p>}
    </div>
  );
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 border border-line bg-cream p-5 sm:p-6">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      {state.error && <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("label", "Address name (e.g. Home, Office)", v?.label ?? "Home", { required: true })}
        {field("fullName", "Recipient name", v?.fullName ?? defaults.name, { required: true, autoComplete: "name" })}
        {field("phone", "Mobile number", v?.phone ?? defaults.phone, { required: true, type: "tel", autoComplete: "tel", placeholder: "01XXXXXXXXX" })}
        <div className="sm:col-span-2">{field("address", "Full address (house, road, area)", v?.address ?? "", { required: true })}</div>
        {field("area", "Area / thana (optional)", v?.area ?? "")}
        {field("city", "City / upazila", v?.city ?? "", { required: true })}
        <div>
          <label htmlFor="a-district" className="label">District <span className="text-danger">*</span></label>
          <select id="a-district" name="district" defaultValue={v?.district ?? "Dhaka"} className="field" aria-invalid={err("district") ? "true" : undefined}>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {err("district") && <p className="field-error">{err("district")}</p>}
        </div>
        {field("postalCode", "Postal code (optional)", v?.postalCode ?? "")}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" defaultChecked={v?.isDefault ?? false} /> Make this my default address
      </label>
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : v?.id ? "Save changes" : "Add address"}</button>
        <Link href="/account/addresses" className="btn btn-outline">Cancel</Link>
      </div>
    </form>
  );
}
