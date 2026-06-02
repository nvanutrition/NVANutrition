import { Metadata, ResolvingMetadata } from 'next';
import { fetchDbProductBySku } from '@/lib/db-products';

type Props = {
  params: Promise<{ sku: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Try fetching the product by SKU (or ID, as our fallback handles both sometimes)
  const resolvedParams = await params;
  const sku = resolvedParams.sku;
  const product = await fetchDbProductBySku(sku);

  if (!product) {
    return {
      title: 'Product Not Found | NVA Nutrition',
      description: 'The requested product could not be found on NVA Nutrition.',
    };
  }

  // Generate dynamic SEO tags targeting the product and long-tail variants
  const title = `${product.name} | Buy Online | NVA Nutrition`;
  const description = product.shortDescription || product.description?.substring(0, 160) || `Buy ${product.name} from NVA Nutrition. Premium sports nutrition for your fitness goals.`;
  
  return {
    title,
    description,
    keywords: `${product.name}, ${product.category}, NVA nutrition ${product.name}, NVA nutrition protein, buy ${product.name} online, premium ${product.category} India, NVA nutrition`,
    openGraph: {
      title,
      description,
      url: `https://nvanutrition.com/products/${sku}`,
      siteName: 'NVA Nutrition',
      images: [
        {
          url: product.images?.[0] || '/logo.png',
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.images?.[0] || '/logo.png'],
    },
  };
}

export default function ProductDetailLayout({ children }: Props) {
  return <>{children}</>;
}
