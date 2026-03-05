"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Sidebar from "@/components/sidebar";
import PurchaseModal from "@/components/purchase-modal";
import { toast } from "sonner";
import { Coins } from "lucide-react";

interface Skin {
  id: string;
  name: string;
  hex_from: string;
  hex_to: string;
  img_url: string | null;
  price: number;
}

interface InventoryItem {
  id: string;
  skin_id: string;
  equipped: boolean;
  skins: Skin;
}

type Tab = "inventory" | "storefront";

export default function SkinsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const [allSkins, setAllSkins] = useState<Skin[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchaseSkin, setPurchaseSkin] = useState<Skin | null>(null);
  const [skinVersion, setSkinVersion] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async (userId: string) => {
    const [{ data: skins }, { data: inv }] = await Promise.all([
      supabase.from("skins").select("*"),
      supabase
        .from("inventories")
        .select("id, skin_id, equipped, skins(*)")
        .eq("user_id", userId),
    ]);
    if (skins) setAllSkins(skins);
    if (inv) setInventory(inv as unknown as InventoryItem[]);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/");
        return;
      }
      setUser(user);
      fetchData(user.id).then(() => setLoading(false));
    });
  }, [router, supabase.auth, fetchData]);

  const ownedSkinIds = new Set(inventory.map((i) => i.skin_id));
  const storefrontSkins = allSkins.filter((s) => !ownedSkinIds.has(s.id));

  const handleBuy = async () => {
    if (!user || !purchaseSkin) return;
    const currentCoins = user.user_metadata?.coins ?? 0;
    if (currentCoins < purchaseSkin.price) {
      toast.error("Purchase Failed", { description: "You don't have enough coins to purchase this skin." });
      setPurchaseSkin(null);
      return;
    }
    const { error } = await supabase.from("inventories").insert({
      user_id: user.id,
      skin_id: purchaseSkin.id,
    });
    if (error) {
      toast.error("Purchase Failed", { description: "Something went wrong. Please try again." });
    } else {
      const newCoins = currentCoins - purchaseSkin.price;
      await supabase.auth.updateUser({ data: { coins: newCoins } });
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser) setUser(refreshedUser);
      await fetchData(user.id);
      setSkinVersion((v) => v + 1);
    }
    setPurchaseSkin(null);
  };

  const handleEquip = async (item: InventoryItem) => {
    if (!user) return;
    // Unequip all, then equip selected
    await supabase
      .from("inventories")
      .update({ equipped: false })
      .eq("user_id", user.id);
    await supabase
      .from("inventories")
      .update({ equipped: true })
      .eq("id", item.id);
    await fetchData(user.id);
    setSkinVersion((v) => v + 1);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const coins = user?.user_metadata?.coins ?? 0;
  const displayedSkins = activeTab === "inventory" ? inventory : storefrontSkins;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar user={user!} activePage="Skins" skinVersion={skinVersion} />

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-10 py-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-[family-name:var(--font-geist-sans)] text-[28px] font-semibold tracking-tight text-foreground" style={{ letterSpacing: "-1px" }}>
              Skins
            </h1>
            <p className="text-sm text-muted-foreground">Customize your cell&apos;s appearance</p>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold text-foreground">{coins.toLocaleString()}</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                activeTab === "inventory"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab("storefront")}
              className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                activeTab === "storefront"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Storefront
            </button>
          </div>
          <span className="text-[13px] text-muted-foreground">
            {displayedSkins.length} {displayedSkins.length === 1 ? "skin" : "skins"}
          </span>
        </div>

        {/* Skin Grid */}
        <div className="grid grid-cols-4 gap-4">
          {activeTab === "inventory" ? (
            inventory.length === 0 ? (
              <p className="col-span-4 text-center text-sm text-muted-foreground py-12">
                No skins yet. Visit the Storefront to get some!
              </p>
            ) : (
              inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center gap-3 rounded-lg border bg-card p-4"
                  style={{
                    borderColor: item.equipped ? "#22C55E" : undefined,
                    borderWidth: item.equipped ? 2 : 1,
                  }}
                >
                  <div
                    className="h-20 w-20 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${item.skins.hex_from}, ${item.skins.hex_to})`,
                    }}
                  />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[13px] font-medium text-foreground">{item.skins.name}</span>
                    {item.equipped ? (
                      <span className="text-[11px] text-green-500">Equipped</span>
                    ) : (
                      <button
                        onClick={() => handleEquip(item)}
                        className="rounded-md bg-secondary px-3 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary/80"
                      >
                        Equip
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            storefrontSkins.length === 0 ? (
              <p className="col-span-4 text-center text-sm text-muted-foreground py-12">
                You own all available skins!
              </p>
            ) : (
              storefrontSkins.map((skin) => (
                <div
                  key={skin.id}
                  className="flex flex-col items-center gap-3 rounded-lg border bg-card p-4"
                >
                  <div
                    className="h-20 w-20 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${skin.hex_from}, ${skin.hex_to})`,
                    }}
                  />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[13px] font-medium text-foreground">{skin.name}</span>
                    <button
                      onClick={() => setPurchaseSkin(skin)}
                      className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Coins className="h-3 w-3" />
                      {skin.price === 0 ? "Free" : skin.price.toLocaleString()}
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </main>

      {purchaseSkin && (
        <PurchaseModal
          skin={purchaseSkin}
          balance={coins}
          onConfirm={handleBuy}
          onCancel={() => setPurchaseSkin(null)}
        />
      )}

    </div>
  );
}
