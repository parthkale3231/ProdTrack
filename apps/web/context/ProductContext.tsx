"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export type OperationStatus = {
  stdTime: number;
  inTime?: string;
  outTime?: string;
  leadTime?: number;
  productNo?: string;
  processName?: string;
  operator?: string;
  status?: "Pending" | "In Progress" | "Completed";
};

export type ProductTrack = {
  lastExec: string;
  itemNo: string;
  itemNoStyle?: "default" | "critical";
  desc: string;
  poNo: string;
  lineNo: number;
  poDate: string;
  poConfirmDelDate?: string;
  remainingDays?: string | number;
  remainingStyle?: "success" | "warning" | "default";
  stdLeadTime?: number;
  woNo: string;
  startDate?: string;
  endDate?: string;
  totalLeadTime?: number;
  currentLeadTime?: number;
  operations: {
    listProvided: OperationStatus;
    cuttingCompleted: OperationStatus;
    roughTurning1: OperationStatus;
    roughTurning2: OperationStatus;
    heatTreatment: OperationStatus;
    finish1st: OperationStatus;
    finish2nd: OperationStatus;
    slotting: OperationStatus;
    inspection: OperationStatus;
    rfd: OperationStatus;
    dispatch: OperationStatus;
  };
  remark: string;
  isArchived?: boolean;
};

export const STAGE_ORDER = [
  { id: "listProvided", label: "List provided", stdTime: 1 },
  { id: "cuttingCompleted", label: "Cutting completed", stdTime: 1 },
  { id: "roughTurning1", label: "Rough turning 1", stdTime: 3 },
  { id: "roughTurning2", label: "Rough turning 2", stdTime: 3 },
  { id: "heatTreatment", label: "Heat treatment", stdTime: 7 },
  { id: "finish1st", label: "Finish 1st", stdTime: 3 },
  { id: "finish2nd", label: "Finish 2nd", stdTime: 2 },
  { id: "slotting", label: "Slotting", stdTime: 2 },
  { id: "inspection", label: "Inspection", stdTime: 1 },
  { id: "rfd", label: "RFD", stdTime: 1 },
  { id: "dispatch", label: "Dispatch", stdTime: 1 },
] as const;

type ProductContextType = {
  products: ProductTrack[];
  getProduct: (itemNo: string) => ProductTrack | undefined;
  registerOrUpdateProduct: (
    productData: Partial<ProductTrack> & { itemNo: string },
    selectedOpId?: string,
    inDateStatus?: string,
    outDateStatus?: string
  ) => Promise<{ success: boolean; error?: string; product?: ProductTrack }>;
  getNextRequiredStage: (product: ProductTrack) => typeof STAGE_ORDER[number] | null;
  getCurrentStage: (product: ProductTrack) => typeof STAGE_ORDER[number] | null;
  deleteProduct: (itemNo: string) => Promise<void>;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  if (dateStr.includes("T")) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  const cleanStr = dateStr.split(",")[0]?.trim() || dateStr;
  const parts = cleanStr.split("-");
  if (parts.length === 3) {
    const p0 = parts[0];
    const p1 = parts[1];
    const p2 = parts[2];
    if (p0 === undefined || p1 === undefined || p2 === undefined) return null;

    if (p0.length === 4) {
      const year = parseInt(p0, 10);
      const month = parseInt(p1, 10) - 1;
      const day = parseInt(p2, 10);
      return new Date(year, month, day);
    } else {
      const day = parseInt(p0, 10);
      const month = parseInt(p1, 10) - 1;
      let year = parseInt(p2, 10);
      if (year < 100) year += 2000;
      
      const timePart = dateStr.split(",")[1]?.trim();
      if (timePart) {
        const timeParts = timePart.split(":");
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0] || "0", 10);
          const minutes = parseInt(timeParts[1] || "0", 10);
          return new Date(year, month, day, hours, minutes);
        }
      }
      return new Date(year, month, day);
    }
  }

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

export const formatDateString = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatDateWithTime = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year}, ${hours}:${minutes}`;
};

export const diffInDays = (d1: Date, d2: Date): number => {
  const diffTime = d2.getTime() - d1.getTime();
  if (diffTime <= 0) {
    const sameDay = d1.getFullYear() === d2.getFullYear() &&
                    d1.getMonth() === d2.getMonth() &&
                    d1.getDate() === d2.getDate();
    return sameDay ? 1 : 0;
  }
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getToday = (): Date => {
  return new Date();
};

export function populateProductFields(prod: ProductTrack): ProductTrack {
  const updatedOperations = { ...prod.operations };

  STAGE_ORDER.forEach((stage) => {
    const key = stage.id as keyof typeof prod.operations;
    const op = { ...updatedOperations[key] } as OperationStatus;

    op.stdTime = stage.stdTime;
    op.productNo = prod.itemNo;
    op.processName = stage.label;

    if (op.inTime && op.outTime) {
      op.status = "Completed";
      const dIn = parseDateString(op.inTime);
      const dOut = parseDateString(op.outTime);
      if (dIn && dOut) {
        op.leadTime = diffInDays(dIn, dOut);
      }
    } else if (op.inTime) {
      op.status = "In Progress";
      op.leadTime = undefined;
    } else {
      op.status = "Pending";
      op.leadTime = undefined;
    }

    if (!op.operator && op.inTime) {
      op.operator = "John Doe";
    }

    updatedOperations[key] = op;
  });

  let startDate = prod.startDate;
  if (updatedOperations.listProvided.inTime) {
    startDate = updatedOperations.listProvided.inTime.split(",")[0]?.trim();
  }
  let endDate = prod.endDate;
  if (updatedOperations.dispatch.outTime) {
    endDate = updatedOperations.dispatch.outTime.split(",")[0]?.trim();
  }

  return {
    ...prod,
    startDate,
    endDate,
    operations: updatedOperations,
  };
}

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<ProductTrack[]>([]);

  // Load from MongoDB on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data.map(populateProductFields));
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
  }, []);

  const dynamicProducts = products.map((p) => {
    let remainingDays = p.remainingDays;
    let remainingStyle = p.remainingStyle || "default";

    if (p.operations.dispatch.outTime) {
      remainingDays = `Dispatched on ${p.operations.dispatch.outTime.split(",")[0]?.trim()}`;
      remainingStyle = "success";
    } else if (p.poConfirmDelDate) {
      const confDate = parseDateString(p.poConfirmDelDate);
      if (confDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffMs = confDate.getTime() - today.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        remainingDays = diffDays;
        remainingStyle = diffDays < 0 ? "warning" : "default";
      }
    }

    let sumCompletedLeadTime = 0;
    let dispatchCompleted = false;
    let hasCompletedStages = false;

    STAGE_ORDER.forEach((stage) => {
      const op = p.operations[stage.id as keyof typeof p.operations];
      if (op.inTime && op.outTime) {
        const dIn = parseDateString(op.inTime);
        const dOut = parseDateString(op.outTime);
        if (dIn && dOut) {
          const lTime = diffInDays(dIn, dOut);
          sumCompletedLeadTime += lTime;
          hasCompletedStages = true;
          if (stage.id === "dispatch") {
            dispatchCompleted = true;
          }
        }
      }
    });

    const currentLeadTime = hasCompletedStages ? sumCompletedLeadTime : undefined;
    const totalLeadTime = dispatchCompleted ? sumCompletedLeadTime : undefined;

    return {
      ...p,
      remainingDays,
      remainingStyle,
      currentLeadTime,
      totalLeadTime,
    };
  });

  const getProduct = (itemNo: string) => {
    return dynamicProducts.find((p) => p.itemNo.toLowerCase() === itemNo.trim().toLowerCase());
  };

  const deleteProduct = async (itemNo: string) => {
    try {
      await fetch(`/api/products/${itemNo}`, { method: 'DELETE' });
      setProducts((prev) => 
        prev.map((p) => 
          p.itemNo.toLowerCase() === itemNo.trim().toLowerCase() 
            ? { ...p, isArchived: true } 
            : p
        )
      );
    } catch (error) {
      console.error("Failed to delete product", error);
    }
  };

  const getNextRequiredStage = (product: ProductTrack) => {
    for (const stage of STAGE_ORDER) {
      const op = product.operations[stage.id as keyof typeof product.operations];
      if (!op.inTime || !op.outTime) {
        return stage;
      }
    }
    return null;
  };

  const getCurrentStage = (product: ProductTrack) => {
    let activeStage: typeof STAGE_ORDER[number] | null = null;
    let lastCompleted: typeof STAGE_ORDER[number] | null = null;

    for (const stage of STAGE_ORDER) {
      const op = product.operations[stage.id as keyof typeof product.operations];
      if (op.inTime && !op.outTime) {
        activeStage = stage;
        break;
      }
      if (op.inTime && op.outTime) {
        lastCompleted = stage;
      }
    }

    return activeStage || lastCompleted || STAGE_ORDER[0];
  };

  const registerOrUpdateProduct = async (
    productData: Partial<ProductTrack> & { itemNo: string },
    selectedOpId?: string,
    inDateStatus?: string,
    outDateStatus?: string
  ): Promise<{ success: boolean; error?: string; product?: ProductTrack }> => {
    const existingIndex = products.findIndex(
      (p) => p.itemNo.toLowerCase() === productData.itemNo.trim().toLowerCase()
    );

    let product: ProductTrack;
    const isNewProduct = existingIndex === -1;

    if (!isNewProduct) {
      product = JSON.parse(JSON.stringify(products[existingIndex]));
    } else {
      if (selectedOpId && selectedOpId !== "listProvided") {
        return {
          success: false,
          error: "Validation Failed: Product does not exist. A new product must start at the first stage: 'List provided' with an 'In' status.",
        };
      }
      if (outDateStatus) {
        return {
          success: false,
          error: "Validation Failed: Product must be registered in the system with an 'In' status at 'List provided' before it can be marked as 'Out'.",
        };
      }

      product = {
        lastExec: formatDateString(new Date()),
        itemNo: productData.itemNo.trim(),
        desc: productData.desc || "",
        poNo: productData.poNo || "",
        lineNo: Number(productData.lineNo) || 0,
        poDate: productData.poDate ? formatDateString(parseDateString(productData.poDate)!) : "",
        poConfirmDelDate: productData.poConfirmDelDate
          ? formatDateString(parseDateString(productData.poConfirmDelDate)!)
          : "",
        stdLeadTime: Number(productData.stdLeadTime) || 30,
        woNo: productData.woNo || "",
        remark: productData.remark || "",
        operations: {
          listProvided: { stdTime: 1 },
          cuttingCompleted: { stdTime: 1 },
          roughTurning1: { stdTime: 3 },
          roughTurning2: { stdTime: 3 },
          heatTreatment: { stdTime: 7 },
          finish1st: { stdTime: 3 },
          finish2nd: { stdTime: 2 },
          slotting: { stdTime: 2 },
          inspection: { stdTime: 1 },
          rfd: { stdTime: 1 },
          dispatch: { stdTime: 1 },
        },
      };
    }

    let tempPoDate = product.poDate;
    if (productData.poDate) {
      const parsed = parseDateString(productData.poDate);
      if (parsed) {
        tempPoDate = formatDateString(parsed);
      }
    }

    if (productData.poConfirmDelDate) {
      const parsedDel = parseDateString(productData.poConfirmDelDate);
      if (parsedDel) {
        if (tempPoDate) {
          const parsedPo = parseDateString(tempPoDate);
          if (parsedPo && parsedDel < parsedPo) {
            return {
              success: false,
              error: `Validation Failed: PO Confirm Delivery Date (${productData.poConfirmDelDate}) cannot be earlier than PO Date (${tempPoDate}).`,
            };
          }
        }
      }
    }

    if (productData.desc) product.desc = productData.desc;
    if (productData.poNo) product.poNo = productData.poNo;
    if (productData.lineNo) product.lineNo = Number(productData.lineNo);
    if (productData.woNo) product.woNo = productData.woNo;
    if (productData.stdLeadTime) product.stdLeadTime = Number(productData.stdLeadTime);
    if (productData.remark) product.remark = productData.remark;

    if (productData.poDate) {
      const parsed = parseDateString(productData.poDate);
      if (parsed) product.poDate = formatDateString(parsed);
    }
    if (productData.poConfirmDelDate) {
      const parsed = parseDateString(productData.poConfirmDelDate);
      if (parsed) product.poConfirmDelDate = formatDateString(parsed);
    }

    if (selectedOpId) {
      const stageIndex = STAGE_ORDER.findIndex((s) => s.id === selectedOpId);
      if (stageIndex === -1) {
        return { success: false, error: "Validation Failed: Invalid operation stage selected." };
      }

      for (let i = 0; i < stageIndex; i++) {
        const prevStage = STAGE_ORDER[i];
        if (!prevStage) continue;
        const prevOp = product.operations[prevStage.id as keyof typeof product.operations];
        if (!prevOp.inTime || !prevOp.outTime) {
          return {
            success: false,
            error: `Validation Failed: Cannot skip stages. Previous stage '${prevStage.label}' must be completed first.`,
          };
        }
      }

      const currentOp = product.operations[selectedOpId as keyof typeof product.operations];

      if (!currentOp.inTime) {
        const parsedIn = inDateStatus ? parseDateString(inDateStatus) : new Date();
        if (!parsedIn) {
          return { success: false, error: "Validation Failed: Invalid In Date format." };
        }

        if (product.poDate) {
          const parsedPo = parseDateString(product.poDate);
          if (parsedPo && parsedIn < parsedPo) {
            return {
              success: false,
              error: `Validation Failed: In Date of current stage (${inDateStatus || formatDateString(parsedIn)}) cannot be earlier than PO Date (${product.poDate}).`,
            };
          }
        }

        if (stageIndex > 0) {
          const prevStage = STAGE_ORDER[stageIndex - 1];
          if (prevStage) {
            const prevOp = product.operations[prevStage.id as keyof typeof product.operations];
            if (prevOp.outTime) {
              const parsedPrevOut = parseDateString(prevOp.outTime);
              if (parsedPrevOut && parsedIn < parsedPrevOut) {
                return {
                  success: false,
                  error: `Validation Failed: In Date of current stage '${STAGE_ORDER[stageIndex]?.label}' cannot be earlier than Out Date of previous stage '${prevStage.label}' (${prevOp.outTime}).`,
                };
              }
            }
          }
        }

        currentOp.inTime = formatDateWithTime(parsedIn);
        currentOp.status = "In Progress";
        currentOp.productNo = product.itemNo;
        currentOp.processName = STAGE_ORDER.find((s) => s.id === selectedOpId)?.label || "";
        if (typeof window !== "undefined") {
          currentOp.operator = localStorage.getItem("username") || "John Doe";
        } else {
          currentOp.operator = "John Doe";
        }
      } 
      else if (currentOp.inTime && !currentOp.outTime) {
        const parsedOut = outDateStatus ? parseDateString(outDateStatus) : new Date();
        if (!parsedOut) {
          return { success: false, error: "Validation Failed: Invalid Out Date format." };
        }

        const parsedIn = parseDateString(currentOp.inTime)!;
        if (parsedOut < parsedIn) {
          return { success: false, error: "Validation Failed: Out Date cannot be earlier than In Date." };
        }

        if (product.poDate) {
          const parsedPo = parseDateString(product.poDate);
          if (parsedPo && parsedOut < parsedPo) {
            return {
              success: false,
              error: `Validation Failed: Out Date of current stage cannot be earlier than PO Date (${product.poDate}).`,
            };
          }
        }

        currentOp.outTime = formatDateWithTime(parsedOut);
        currentOp.leadTime = diffInDays(parsedIn, parsedOut);
        currentOp.status = "Completed";
        if (typeof window !== "undefined") {
          currentOp.operator = localStorage.getItem("username") || "John Doe";
        }
      } 
      else if (currentOp.inTime && currentOp.outTime) {
        return {
          success: false,
          error: `Validation Failed: Process stage '${selectedOpId}' is already completed. Duplicate entries are locked.`,
        };
      }
    }

    product.lastExec = formatDateString(new Date());

    try {
      const method = isNewProduct ? 'POST' : 'PUT';
      const url = isNewProduct ? '/api/products' : `/api/products/${product.itemNo}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "API Error" };
      }

      setProducts((prevProducts) => {
        const next = [...prevProducts];
        const updatedProduct = populateProductFields(product);
        if (!isNewProduct) {
          next[existingIndex] = updatedProduct;
        } else {
          next.push(updatedProduct);
        }
        return next;
      });

      return { success: true, product: populateProductFields(product) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products: dynamicProducts,
        getProduct,
        registerOrUpdateProduct,
        getNextRequiredStage,
        getCurrentStage,
        deleteProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
