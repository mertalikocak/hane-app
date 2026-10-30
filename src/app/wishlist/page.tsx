import { WishlistView } from "@/components/wishlist/WishlistView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hane Wish List | İstek Listesi",
  description: "Aile bireyleri ve hane için ortak & kişisel istek listesi.",
};

export default function WishlistPage() {
  return (
    <div className="pb-8">
      <WishlistView />
    </div>
  );
}
