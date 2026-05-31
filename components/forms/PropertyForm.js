import Image from "next/image";
import { createProperty, deleteImage, updateProperty } from "@/app/actions";
import { PROPERTY_TYPES, SAUDI_CITIES } from "@/lib/constants/options";
import { Field, inputClass } from "@/components/forms/Field";
import { ImageUploadField } from "@/components/forms/ImageUploadField";

export function PropertyForm({ property, images = [], canUploadImages = true, missingUploadConfig = [] }) {
  const isEdit = Boolean(property?.id);
  const action = isEdit ? updateProperty : createProperty;

  return (
    <div className="grid gap-6">
      <form action={action} encType="multipart/form-data" className="grid gap-6 rounded-lg border border-zinc-200 bg-white p-6">
        {isEdit ? <input type="hidden" name="property_id" value={property.id} /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input className={inputClass} name="title" defaultValue={property?.title} required />
          </Field>
          <Field label="Purpose">
            <select className={inputClass} name="purpose" defaultValue={property?.purpose || "sale"}>
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </select>
          </Field>
          <Field label="Property type">
            <select className={inputClass} name="property_type" defaultValue={property?.property_type || "Apartment"}>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price">
            <input className={inputClass} name="price" type="number" min="0" defaultValue={property?.price} required />
          </Field>
          <Field label="City">
            <select className={inputClass} name="city" defaultValue={property?.city || "Riyadh"}>
              {SAUDI_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </Field>
          <Field label="District">
            <input className={inputClass} name="district" defaultValue={property?.district} required />
          </Field>
          <Field label="Address">
            <input className={inputClass} name="address" defaultValue={property?.address} />
          </Field>
          <Field label="Area sqm">
            <input className={inputClass} name="area_sqm" type="number" min="1" defaultValue={property?.area_sqm} required />
          </Field>
          <Field label="Bedrooms">
            <input className={inputClass} name="bedrooms" type="number" min="0" defaultValue={property?.bedrooms || 0} />
          </Field>
          <Field label="Bathrooms">
            <input className={inputClass} name="bathrooms" type="number" min="0" defaultValue={property?.bathrooms || 0} />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className={`${inputClass} min-h-36`}
            name="description"
            defaultValue={property?.description}
            required
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
          <input name="furnished" type="checkbox" defaultChecked={property?.furnished} />
          Furnished
        </label>
        {canUploadImages ? (
          <Field label="Property images">
            <ImageUploadField />
          </Field>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Image uploads are not configured.</p>
            <p className="mt-1">
              Add the missing Cloudflare R2 environment values before uploading property images:
              {" "}
              {missingUploadConfig.join(", ")}.
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-900"
            name="submit_action"
            value="draft"
          >
            Save draft
          </button>
          <button
            className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
            name="submit_action"
            value="submit"
          >
            Submit for approval
          </button>
        </div>
      </form>
      {images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-md border border-zinc-200">
              <Image
                className="aspect-[4/3] w-full object-cover"
                src={image.public_url}
                alt=""
                width={320}
                height={240}
              />
              <form action={deleteImage} className="p-2">
                <input type="hidden" name="image_id" value={image.id} />
                <input type="hidden" name="property_id" value={property.id} />
                <input type="hidden" name="object_key" value={image.object_key} />
                <button className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
