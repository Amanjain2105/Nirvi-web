import { wixClientServer } from "@/lib/wixClientServer";
import { products } from "@wix/stores";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import Pagination from "./Pagination";

const PRODUCT_PER_PAGE = 8;

const ProductList = async ({
  categoryId,
  limit,
  searchParams,
}: {
  categoryId?: string;
  limit?: number;
  searchParams?: any;
}) => {
  const wixClient = await wixClientServer();

  let productQuery = wixClient.products.queryProducts();

  if (searchParams?.name) {
    productQuery = productQuery.startsWith("name", searchParams.name);
  }

  if (categoryId) {
    productQuery = productQuery.eq("collectionIds", categoryId);
  }

  productQuery = productQuery.hasSome(
    "productType",
    searchParams?.type ? [searchParams.type] : ["physical", "digital"]
  );

  productQuery = productQuery.gt("priceData.price", searchParams?.min || 0);
  productQuery = productQuery.lt("priceData.price", searchParams?.max || 999999);

  productQuery = productQuery.limit(limit || PRODUCT_PER_PAGE);
  productQuery = productQuery.skip(
    searchParams?.page
      ? parseInt(searchParams.page) * (limit || PRODUCT_PER_PAGE)
      : 0
  );

  if (searchParams?.sort) {
    const [sortType, sortBy] = searchParams.sort.split(" ");
    if (sortBy) {
      if (sortType === "asc") productQuery = productQuery.ascending(sortBy);
      if (sortType === "desc") productQuery = productQuery.descending(sortBy);
    }
  }

  console.log("CATEGORY_ID:", categoryId);
  console.log("SEARCH_PARAMS:", searchParams);

  const res = await productQuery.find();

  return (
    <div className="mt-12 flex gap-x-8 gap-y-16 justify-between flex-wrap">
      {res.items && res.items.length > 0 ? (
        res.items.map((product: products.Product) => {
          const shortDesc =
            product.additionalInfoSections?.find(
              (section: any) => section.title === "shortDesc"
            )?.description || "";

          return (
            <Link
              href={`/${product.slug}`}
              className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]"
              key={product._id}
            >
              <div className="relative w-full h-80">
                <Image
                  src={product.media?.mainMedia?.image?.url || "/product.png"}
                  alt={product.name?? ""}
                  fill
                  sizes="25vw"
                  className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity ease duration-500"
                />
                {product.media?.items?.[1]?.image?.url && (
                  <Image
                    src={product.media.items[1].image.url}
                    alt={product.name?? ""}
                    fill
                    sizes="25vw"
                    className="absolute object-cover rounded-md"
                  />
                )}
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{product.name}</span>
                <span className="font-semibold">${product.price?.price}</span>
              </div>
              {shortDesc && (
                <div
                  className="text-sm text-gray-500"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(shortDesc),
                  }}
                />
              )}
              <button className="rounded-2xl ring-1 ring-lama text-lama w-max py-2 px-4 text-xs hover:bg-lama hover:text-white">
                  Add to Cart
              </button>
            </Link>
          );
        })
      ) : (
        <div className="w-full text-center text-gray-500">No products found.</div>
      )}

      {(searchParams?.cat || searchParams?.name) && (
        <Pagination
          currentPage={res.currentPage || 0}
          hasPrev={res.hasPrev()}
          hasNext={res.hasNext()}
        />
      )}
    </div>
  );
};

export default ProductList;