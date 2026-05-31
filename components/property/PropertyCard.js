import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/data";

export function PropertyCard({ property }) {
  const image = property.property_images?.[0]?.public_url;

  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <Link href={`/properties/${property.id}`} className="block">
        <div className="aspect-[4/3] bg-zinc-100">
          {image ? (
            <Image
              className="h-full w-full object-cover"
              src={image}
              alt={property.title}
              width={640}
              height={480}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              No image
            </div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div>
            <p className="text-lg font-semibold text-zinc-950">
              {formatPrice(property.price, property.purpose)}
            </p>
            <h2 className="mt-1 line-clamp-2 text-base font-medium text-zinc-900">
              {property.title}
            </h2>
          </div>
          <p className="text-sm text-zinc-600">
            {property.district}, {property.city}
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-700">
            <span>{property.bedrooms} beds</span>
            <span>{property.bathrooms} baths</span>
            <span>{Number(property.area_sqm).toLocaleString("en-US")} sqm</span>
          </div>
          <p className="text-xs uppercase tracking-wide text-teal-700">
            {property.purpose} · {property.property_type}
          </p>
        </div>
      </Link>
    </article>
  );
}
