"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, PackageCheck, Percent, TrendingUp, DollarSign } from "lucide-react";
import { createOrderAction, updateOrderAction } from "@/lib/actions";
import { calculateBundlePrice, calculateBundleCost } from "@/lib/bundles";

interface OrderModalProps {
  order?: {
    id: string;
    orderNumber?: string;
    customerId: string;
    source: string;
    status?: string;
    assignedPartnerId: string | null;
    eventType: string | null;
    eventDate: Date | null;
    deliveryDate: Date | null;
    deliveryAddress: string | null;
    discount: any;
    notes: string | null;
    items: Array<{
      productId?: string | null;
      bundleId?: string | null;
      description: string;
      quantity: number;
      unitPrice: any;
      costPriceSnapshot?: any;
      marginRate?: number | null;
      customizationDetails: string | null;
    }>;
  } | null;
  customers: Array<{ id: string; name: string; phone: string }>;
  partners: Array<{ id: string; name: string }>;
  products?: Array<{ id: string; name: string; sku: string; purchaseCost: any; currentStock: number }>;
  bundles?: Array<any>;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({
  order,
  customers,
  partners,
  products = [],
  bundles = [],
  isOpen,
  onClose,
}: OrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [globalMargin, setGlobalMargin] = useState<number | "">("");

  const [items, setItems] = useState<
    Array<{
      productId?: string;
      bundleId?: string;
      description: string;
      quantity: number;
      costPrice: number; // Inventory unit cost
      unitPrice: number; // Selling price charged to customer
      marginRate: number; // Markup / Margin %
      customizationDetails: string;
    }>
  >([
    { description: "", quantity: 1, costPrice: 0, unitPrice: 0, marginRate: 0, customizationDetails: "" },
  ]);

  const isEditing = Boolean(order);

  useEffect(() => {
    if (order) {
      setDiscount(Number(order.discount) || 0);
      if (order.items && order.items.length > 0) {
        setItems(
          order.items.map((i) => {
            const cost = Number(i.costPriceSnapshot) || 0;
            const price = Number(i.unitPrice) || 0;
            const margin = i.marginRate !== undefined && i.marginRate !== null
              ? Number(i.marginRate)
              : cost > 0 ? ((price - cost) / cost) * 100 : 0;

            return {
              productId: i.productId || undefined,
              bundleId: i.bundleId || undefined,
              description: i.description,
              quantity: i.quantity,
              costPrice: cost,
              unitPrice: price,
              marginRate: Number(margin.toFixed(1)),
              customizationDetails: i.customizationDetails || "",
            };
          })
        );
      }
    } else {
      setDiscount(0);
      setGlobalMargin("");
      setItems([{ description: "", quantity: 1, costPrice: 0, unitPrice: 0, marginRate: 0, customizationDetails: "" }]);
    }
  }, [order, isOpen]);

  if (!isOpen) return null;

  function handleAddItem() {
    setItems([
      ...items,
      { description: "", quantity: 1, costPrice: 0, unitPrice: 0, marginRate: 0, customizationDetails: "" },
    ]);
  }

  function handleRemoveItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  }

  // Reactive price & margin calculation handlers
  function handleItemChange(index: number, field: string, value: any) {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === "costPrice") {
      const cost = Number(value) || 0;
      const margin = current.marginRate || 0;
      const newUnitPrice = margin > 0 ? cost * (1 + margin / 100) : current.unitPrice;
      current.costPrice = cost;
      current.unitPrice = Number(newUnitPrice.toFixed(2));
      current.marginRate = cost > 0 ? Number((((current.unitPrice - cost) / cost) * 100).toFixed(1)) : 0;
    } else if (field === "marginRate") {
      const margin = Number(value) || 0;
      const cost = current.costPrice || 0;
      const newUnitPrice = cost * (1 + margin / 100);
      current.marginRate = margin;
      current.unitPrice = Number(newUnitPrice.toFixed(2));
    } else if (field === "unitPrice") {
      const price = Number(value) || 0;
      const cost = current.costPrice || 0;
      current.unitPrice = price;
      current.marginRate = cost > 0 ? Number((((price - cost) / cost) * 100).toFixed(1)) : 0;
    }

    updated[index] = current;
    setItems(updated);
  }

  function handleApplyGlobalMargin(newMarginVal: number | "") {
    setGlobalMargin(newMarginVal);
    if (newMarginVal === "" || isNaN(Number(newMarginVal))) return;

    const margin = Number(newMarginVal);
    const updated = items.map((item) => {
      const cost = item.costPrice || 0;
      const newPrice = cost > 0 ? cost * (1 + margin / 100) : item.unitPrice;
      return {
        ...item,
        marginRate: margin,
        unitPrice: Number(newPrice.toFixed(2)),
      };
    });
    setItems(updated);
  }

  function handleSelectCatalogItem(index: number, selectionValue: string) {
    const updated = [...items];
    if (!selectionValue) {
      updated[index] = {
        ...updated[index],
        productId: undefined,
        bundleId: undefined,
        costPrice: 0,
        marginRate: 0,
      };
    } else if (selectionValue.startsWith("product:")) {
      const pId = selectionValue.replace("product:", "");
      const prod = products.find((p) => p.id === pId);
      if (prod) {
        const cost = Number(prod.purchaseCost) || 0;
        updated[index] = {
          ...updated[index],
          productId: prod.id,
          bundleId: undefined,
          description: `[SKU: ${prod.sku}] ${prod.name}`,
          costPrice: cost,
          unitPrice: cost, // default 0% margin (at-cost)
          marginRate: 0,
        };
      }
    } else if (selectionValue.startsWith("bundle:")) {
      const bId = selectionValue.replace("bundle:", "");
      const bndl = bundles.find((b) => b.id === bId);
      if (bndl) {
        const cost = calculateBundleCost(bndl.bundleItems || []);
        const bPrice = calculateBundlePrice(bndl.pricingType, bndl.bundlePrice, bndl.bundleItems || []);
        const defaultPrice = bPrice > 0 ? bPrice : cost;
        const margin = cost > 0 ? ((defaultPrice - cost) / cost) * 100 : 0;

        updated[index] = {
          ...updated[index],
          productId: undefined,
          bundleId: bndl.id,
          description: `[Combo: ${bndl.sku}] ${bndl.name}`,
          costPrice: cost,
          unitPrice: Number(defaultPrice.toFixed(2)),
          marginRate: Number(margin.toFixed(1)),
        };
      }
    }
    setItems(updated);
  }

  // Financial Breakdown Calculations
  const totalCogs = items.reduce((sum, item) => sum + item.quantity * (item.costPrice || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - discount);
  const projectedGrossProfit = total - totalCogs;
  const overallGrossMarginPercent = total > 0 ? ((projectedGrossProfit / total) * 100).toFixed(1) : "0";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: (formData.get("customerId") as string) || undefined,
      source: formData.get("source") as "WHATSAPP" | "INSTAGRAM" | "OTHER",
      status: (formData.get("status") as any) || undefined,
      assignedPartnerId: (formData.get("assignedPartnerId") as string) || undefined,
      eventType: (formData.get("eventType") as string) || undefined,
      eventDate: (formData.get("eventDate") as string) || undefined,
      deliveryDate: (formData.get("deliveryDate") as string) || undefined,
      deliveryAddress: (formData.get("deliveryAddress") as string) || undefined,
      discount,
      notes: (formData.get("notes") as string) || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        bundleId: item.bundleId,
        description: item.description,
        quantity: Number(item.quantity),
        costPrice: Number(item.costPrice || 0),
        unitPrice: Number(item.unitPrice),
        marginRate: Number(item.marginRate || 0),
        customizationDetails: item.customizationDetails || undefined,
      })),
    };

    try {
      const res = isEditing && order
        ? await updateOrderAction(order.id, data)
        : await createOrderAction(data);

      if (!res.success) {
        setError(res.error || "Failed to save order.");
        return;
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save order.");
      }
    } finally {
      setLoading(false);
    }
  }

  const defaultEventDate = order?.eventDate
    ? new Date(order.eventDate).toISOString().split("T")[0]
    : "";
  const defaultDeliveryDate = order?.deliveryDate
    ? new Date(order.deliveryDate).toISOString().split("T")[0]
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#20231f]">
              {isEditing ? `Edit Order ${order?.orderNumber || ""}` : "Create New Order"}
            </h2>
            <p className="text-xs text-[#6b746c]">
              Automatic cost price retrieval, reactive margin controls, and persistent financial snapshotting.
            </p>
          </div>
          <button onClick={onClose} type="button" className="rounded-lg p-1.5 text-[#6b746c] hover:bg-[#edf1e8]">
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Select Customer *</label>
              <select
                name="customerId"
                required
                defaultValue={order?.customerId || ""}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Order Source *</label>
              <select
                name="source"
                required
                defaultValue={order?.source || "WHATSAPP"}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="PHONE_CALL">Phone Call</option>
                <option value="OFFLINE">Offline / Walk-in</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Order Status *</label>
              <select
                name="status"
                defaultValue={order?.status || "NEW"}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#edf1e8] px-2 py-2 text-xs font-bold text-[#263326] focus:border-[#3f563f] focus:outline-none"
              >
                <option value="NEW">NEW</option>
                <option value="QUOTED">QUOTED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="ADVANCE_PAID">ADVANCE_PAID</option>
                <option value="DESIGNING">DESIGNING</option>
                <option value="PRODUCTION">PRODUCTION</option>
                <option value="READY">READY</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Assign Partner</label>
              <select
                name="assignedPartnerId"
                defaultValue={order?.assignedPartnerId || ""}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                <option value="">Unassigned</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Event Date</label>
              <input
                type="date"
                name="eventDate"
                defaultValue={defaultEventDate}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Delivery Date</label>
              <input
                type="date"
                name="deliveryDate"
                defaultValue={defaultDeliveryDate}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Delivery Address</label>
            <textarea
              name="deliveryAddress"
              rows={2}
              defaultValue={order?.deliveryAddress || ""}
              placeholder="Delivery destination address..."
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          {/* Global Margin Rate Controls */}
          <div className="flex items-center justify-between rounded-lg border border-[#d8ded2] bg-[#f8faf6] p-3">
            <div className="flex items-center gap-2">
              <Percent className="size-4 text-[#3f563f]" />
              <div>
                <span className="text-xs font-bold text-[#20231f]">Global Uniform Margin Rate (%)</span>
                <p className="text-[11px] text-[#6b746c]">Apply a uniform markup percentage to all line items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="e.g. 25"
                step="0.1"
                value={globalMargin}
                onChange={(e) => handleApplyGlobalMargin(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-24 rounded-md border border-[#d8ded2] bg-white px-2.5 py-1 text-xs font-semibold text-[#20231f] focus:border-[#3f563f] focus:outline-none"
              />
              <span className="text-xs font-semibold text-[#4e584f]">%</span>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#4e584f]">Order Line Items *</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#3f563f] hover:underline"
              >
                <Plus className="size-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const currentSelection = item.bundleId
                  ? `bundle:${item.bundleId}`
                  : item.productId
                  ? `product:${item.productId}`
                  : "";

                return (
                  <div key={idx} className="rounded-lg border border-[#edf1e8] bg-[#f8faf6] p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#6b746c]">Select Catalog Product or Combo</label>
                        <select
                          value={currentSelection}
                          onChange={(e) => handleSelectCatalogItem(idx, e.target.value)}
                          className="mt-0.5 w-full rounded-md border border-[#d8ded2] bg-white px-2.5 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none font-medium text-[#20231f]"
                        >
                          <option value="">Custom Item (Manual Entry)</option>
                          {bundles.length > 0 && (
                            <optgroup label="Product Combos / Bundles">
                              {bundles.map((b) => (
                                <option key={b.id} value={`bundle:${b.id}`}>
                                  📦 [Combo] {b.name} ({b.sku}) - Cost: ₹{calculateBundleCost(b.bundleItems || [])}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {products.length > 0 && (
                            <optgroup label="Standalone Products">
                              {products.map((p) => (
                                <option key={p.id} value={`product:${p.id}`}>
                                  🏷️ {p.name} ({p.sku}) - Cost: ₹{Number(p.purchaseCost || 0)} | Stock: {p.currentStock}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-[#6b746c]">Item Description *</label>
                        <input
                          type="text"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          required
                          className="mt-0.5 w-full rounded-md border border-[#d8ded2] bg-white px-2.5 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 items-center">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#6b746c]">Quantity</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                          required
                          className="mt-0.5 w-full rounded-md border border-[#d8ded2] bg-white px-2 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-amber-900">Inventory Cost (₹)</label>
                        <input
                          type="number"
                          placeholder="Cost (₹)"
                          step="0.01"
                          min={0}
                          value={item.costPrice}
                          onChange={(e) => handleItemChange(idx, "costPrice", Number(e.target.value))}
                          className="mt-0.5 w-full rounded-md border border-amber-200 bg-amber-50/40 px-2 py-1.5 text-xs font-semibold text-amber-900 focus:border-[#3f563f] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-emerald-900">Margin (%)</label>
                        <input
                          type="number"
                          placeholder="Margin %"
                          step="0.1"
                          value={item.marginRate}
                          onChange={(e) => handleItemChange(idx, "marginRate", Number(e.target.value))}
                          className="mt-0.5 w-full rounded-md border border-emerald-200 bg-emerald-50/40 px-2 py-1.5 text-xs font-bold text-emerald-950 focus:border-[#3f563f] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-[#20231f]">Selling Price (₹)</label>
                        <input
                          type="number"
                          placeholder="Selling Price (₹)"
                          step="0.01"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                          required
                          className="mt-0.5 w-full rounded-md border border-[#d8ded2] bg-white px-2 py-1.5 text-xs font-bold text-[#20231f] focus:border-[#3f563f] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-[10px] font-semibold text-[#6b746c]">Line Total</label>
                          <p className="mt-1 text-xs font-bold text-[#263326]">
                            ₹{(item.quantity * item.unitPrice).toLocaleString()}
                          </p>
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Customization details (e.g. Card inscription, Ribbon color)"
                      value={item.customizationDetails}
                      onChange={(e) => handleItemChange(idx, "customizationDetails", e.target.value)}
                      className="w-full rounded-md border border-[#d8ded2] bg-white px-2.5 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Order Financial Summary Breakdown */}
          <div className="rounded-xl border border-[#d8ded2] bg-[#f8faf6] p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-[#edf1e8] pb-2">
              <TrendingUp className="size-4 text-[#3f563f]" />
              <span className="text-xs font-bold text-[#20231f]">Live Order Profitability Breakdown</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-[#edf1e8] bg-white p-2.5">
                <span className="text-[10px] font-semibold text-amber-800 uppercase">Total COGS (Cost)</span>
                <p className="mt-1 text-sm font-bold text-amber-900">₹{totalCogs.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-[#edf1e8] bg-white p-2.5">
                <span className="text-[10px] font-semibold text-[#6b746c] uppercase">Total Revenue</span>
                <p className="mt-1 text-sm font-bold text-[#20231f]">₹{total.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-[#edf1e8] bg-white p-2.5">
                <span className="text-[10px] font-semibold text-emerald-800 uppercase">Projected Profit</span>
                <p className="mt-1 text-sm font-bold text-emerald-950">₹{projectedGrossProfit.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-[#edf1e8] bg-white p-2.5">
                <span className="text-[10px] font-semibold text-emerald-800 uppercase">Gross Margin %</span>
                <p className="mt-1 text-sm font-bold text-emerald-950">{overallGrossMarginPercent}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#edf1e8]">
              <div>
                <label className="font-semibold text-[#4e584f]">Order Discount (₹):</label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="ml-2 w-24 rounded-md border border-[#d8ded2] bg-white px-2 py-0.5 text-xs focus:outline-none"
                />
              </div>
              <div className="text-right">
                <span className="text-[#6b746c]">Subtotal: ₹{subtotal.toLocaleString()}</span>
                <span className="ml-3 font-bold text-[#263326]">Final Total: ₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Order Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={order?.notes || ""}
              placeholder="Internal order notes..."
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d8ded2] px-4 py-2 text-xs font-medium text-[#4e584f] hover:bg-[#edf1e8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-xs font-medium text-white hover:bg-[#394a39] disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
