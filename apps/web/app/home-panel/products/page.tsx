"use client";
import { useState } from "react";
import Link from "next/link";
import { Clock, User } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useProducts, STAGE_ORDER, parseDateString, diffInDays } from "../../../context/ProductContext";

export default function ProductsPage() {
  const { getProduct, registerOrUpdateProduct, getNextRequiredStage, deleteProduct } = useProducts();

  // State for form fields
  const [itemNo, setItemNo] = useState("");
  const [description, setDescription] = useState("");
  const [poNo, setPoNo] = useState("");
  const [lineNo, setLineNo] = useState("");
  const [poDate, setPoDate] = useState("");
  const [poConfirmDelyDate, setPoConfirmDelyDate] = useState("");
  const [woNo, setWoNo] = useState("");
  const [stdLeadTime, setStdLeadTime] = useState("");
  const [operation, setOperation] = useState("");

  // Product status state
  const [inDateStatus, setInDateStatus] = useState("");
  const [outDateStatus, setOutDateStatus] = useState("");
  const [remark, setRemark] = useState("");

  // Track completed state to show Prod Out button
  const [isCompletedProduct, setIsCompletedProduct] = useState(false);

  // Banner status
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Helper to format date-time string "DD-MM-YYYY, HH:mm" to input value "YYYY-MM-DDTHH:mm"
  const formatToInputDatetime = (dStr?: string) => {
    if (!dStr) return "";
    const parsed = parseDateString(dStr);
    if (!parsed) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    const hours = String(parsed.getHours()).padStart(2, "0");
    const minutes = String(parsed.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper to format "DD-MM-YYYY" to input date "YYYY-MM-DD"
  const formatToInputDate = (dStr?: string) => {
    if (!dStr) return "";
    const parts = dStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dStr;
  };

  // Get current datetime local formatted string for auto-populating
  const getCurrentDatetimeLocalString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleItemNoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchProductDetails(itemNo);
    }
  };

  const fetchProductDetails = (searchItemNo: string) => {
    if (!searchItemNo.trim()) {
      setNotification({ message: "Please enter an Item number to search.", type: "error" });
      return;
    }

    const prod = getProduct(searchItemNo);
    if (prod) {
      // Product exists - populate details
      setDescription(prod.desc);
      setPoNo(prod.poNo);
      setLineNo(String(prod.lineNo));
      setPoDate(formatToInputDate(prod.poDate));
      setPoConfirmDelyDate(formatToInputDate(prod.poConfirmDelDate));
      setWoNo(prod.woNo);
      setStdLeadTime(String(prod.stdLeadTime));
      setRemark(prod.remark);

      // Enforce stage logic
      const nextStage = getNextRequiredStage(prod);
      setIsCompletedProduct(nextStage === null);

      if (nextStage) {
        setOperation(nextStage.id);
        
        const opData = prod.operations[nextStage.id as keyof typeof prod.operations];
        
        // Lockout and pre-population rules
        if (opData.inTime) {
          setInDateStatus(formatToInputDatetime(opData.inTime));
          setOutDateStatus(getCurrentDatetimeLocalString());
        } else {
          setInDateStatus(getCurrentDatetimeLocalString());
          setOutDateStatus("");
        }

        setNotification({
          message: `Product details loaded. Next operation in queue: "${nextStage.label}".`,
          type: "info",
        });
      } else {
        setOperation("");
        setInDateStatus("");
        setOutDateStatus("");
        setNotification({
          message: `Product loaded. All operations (including Dispatch) are completed.`,
          type: "success",
        });
      }
    } else {
      // Product does not exist - reset other fields for new entry
      setIsCompletedProduct(false);
      setDescription("");
      setPoNo("");
      setLineNo("");
      setPoDate("");
      setPoConfirmDelyDate("");
      setWoNo("");
      setStdLeadTime("30");
      setOperation("listProvided"); // Default to first stage
      
      setInDateStatus(getCurrentDatetimeLocalString()); // Auto start listProvided
      setOutDateStatus("");
      setRemark("");

      setNotification({
        message: "Product not found. Fill in the fields below to register as a new product starting at 'List provided'.",
        type: "info",
      });
    }
  };

  const handleProdIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNo.trim()) {
      setNotification({ message: "Item number is required.", type: "error" });
      return;
    }

    // Call shared database state updater
    const result = registerOrUpdateProduct(
      {
        itemNo,
        desc: description,
        poNo,
        lineNo: Number(lineNo) || 0,
        poDate,
        poConfirmDelDate: poConfirmDelyDate,
        stdLeadTime: Number(stdLeadTime) || 30,
        woNo,
        remark,
      },
      operation || undefined,
      inDateStatus || undefined,
      outDateStatus || undefined
    );

    if (!result.success) {
      setNotification({
        message: result.error || "Validation failed during processing.",
        type: "error",
      });
      return;
    }

    // Success! Re-load product details to show computed statuses
    fetchProductDetails(itemNo);

    setNotification({
      message: `Stage successfully updated for product ${itemNo}!`,
      type: "success",
    });
  };

  const handleProdOut = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!itemNo.trim()) {
      setNotification({ message: "Item number is required to perform Prod Out.", type: "error" });
      return;
    }

    // Double check that it's actually completed in client state
    const prod = getProduct(itemNo);
    if (!prod || getNextRequiredStage(prod) !== null) {
      setNotification({
        message: "Validation Failed: Cannot perform Prod Out. Product must exist and all process stages must be completed.",
        type: "error",
      });
      return;
    }

    // Remove from central database
    deleteProduct(itemNo);

    // Reset Form
    setItemNo("");
    setDescription("");
    setPoNo("");
    setLineNo("");
    setPoDate("");
    setPoConfirmDelyDate("");
    setWoNo("");
    setStdLeadTime("30");
    setOperation("");
    setInDateStatus("");
    setOutDateStatus("");
    setRemark("");
    setIsCompletedProduct(false);

    setNotification({
      message: `Product ${itemNo} has been successfully checked out and removed from the active tracking database.`,
      type: "success",
    });
  };

  // Compute read-only fields dynamically on every render
  const loadedProduct = itemNo.trim() ? getProduct(itemNo) : undefined;
  
  const totalLeadTimeDisplay = loadedProduct?.totalLeadTime !== undefined 
    ? `${loadedProduct.totalLeadTime} Days` 
    : "";
  
  const currentLeadTimeDisplay = loadedProduct?.currentLeadTime !== undefined 
    ? `${loadedProduct.currentLeadTime} Days` 
    : "";
  
  const remainPoDaysDisplay = loadedProduct?.remainingDays !== undefined 
    ? String(loadedProduct.remainingDays) 
    : "";
  
  const startDateDisplay = loadedProduct?.startDate 
    ? formatToInputDate(loadedProduct.startDate) 
    : "";
  
  const endDateDisplay = loadedProduct?.endDate 
    ? formatToInputDate(loadedProduct.endDate) 
    : "";
  
  const currentOperationDisplay = loadedProduct 
    ? (getNextRequiredStage(loadedProduct)?.label || "All Stages Completed") 
    : "";

  const isStageStarted = loadedProduct && operation 
    ? !!loadedProduct.operations[operation as keyof typeof loadedProduct.operations]?.inTime 
    : false;

  return (
    <main className="flex-1 p-6 md:p-8 flex flex-col justify-between relative bg-transparent text-neutral-900 dark:text-white transition-colors duration-500 font-sans">
      <div className="max-w-6xl mx-auto w-full flex flex-col justify-center flex-1 my-auto animate-fade-in">
        
        {/* Header Console */}
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-900 mb-8">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">Manage Products</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-450 mt-1">Operational product processing console</p>
          </div>
          <Button asChild variant="outline" className="font-semibold rounded-lg px-5 py-2 border border-neutral-200 dark:border-neutral-800 bg-white hover:bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer shadow-xs">
            <Link href="/home-panel">Back</Link>
          </Button>
        </div>

        {/* Notification Toast/Banner */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg border text-sm font-medium transition-all duration-300 animate-fade-in ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : notification.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Form container */}
        <form onSubmit={handleProdIn} className="flex flex-col gap-10">
          
          {/* ── Section 1: In/Out Product ── */}
          <div className="flex flex-col gap-6">
            <div className="border-b border-neutral-200 dark:border-neutral-900 pb-2">
              <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight">In/Out Product</h4>
            </div>

            {/* Row 1: 5 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="itemNo" className="text-neutral-850 dark:text-neutral-200">Item no</Label>
                  <span className="text-[10px] text-neutral-500 font-mono">Press Enter</span>
                </div>
                <Input
                  id="itemNo"
                  value={itemNo}
                  onChange={(e) => setItemNo(e.target.value)}
                  onKeyDown={handleItemNoKeyDown}
                  placeholder="e.g. IT-889"
                  className="bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description" className="text-neutral-850 dark:text-neutral-200">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Laser Diode Module"
                  className="bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="poNo" className="text-neutral-850 dark:text-neutral-200">PO No</Label>
                <Input
                  id="poNo"
                  value={poNo}
                  onChange={(e) => setPoNo(e.target.value)}
                  placeholder="e.g. PO-749"
                  className="bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="lineNo" className="text-neutral-850 dark:text-neutral-200">Line no</Label>
                <Input
                  id="lineNo"
                  value={lineNo}
                  onChange={(e) => setLineNo(e.target.value)}
                  placeholder="e.g. L-04"
                  className="bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="poDate" className="text-neutral-850 dark:text-neutral-200">PO Date</Label>
                <Input
                  id="poDate"
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="[color-scheme:light] dark:[color-scheme:dark] bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300"
                />
              </div>
            </div>

            {/* Row 2: 4 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="poConfirmDelyDate" className="text-neutral-850 dark:text-neutral-200">PO Confirm Dely Date</Label>
                <Input
                  id="poConfirmDelyDate"
                  type="date"
                  value={poConfirmDelyDate}
                  onChange={(e) => setPoConfirmDelyDate(e.target.value)}
                  className="[color-scheme:light] dark:[color-scheme:dark] bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="woNo" className="text-neutral-850 dark:text-neutral-200">W/O no</Label>
                <Input
                  id="woNo"
                  value={woNo}
                  onChange={(e) => setWoNo(e.target.value)}
                  placeholder="e.g. WO-902"
                  className="bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="stdLeadTime" className="text-neutral-850 dark:text-neutral-200">Std. Lead Time</Label>
                <Input
                  id="stdLeadTime"
                  value={stdLeadTime}
                  onChange={(e) => setStdLeadTime(e.target.value)}
                  placeholder="e.g. 10"
                  className="bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-300"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="operation" className="text-neutral-850 dark:text-neutral-200">Select Operation</Label>
                <select
                  id="operation"
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                  disabled={!!loadedProduct} // Locked to active stage once product is registered
                  className="flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/50 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-300 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors duration-200 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="" disabled className="bg-white dark:bg-neutral-950 text-neutral-500">Select Operation...</option>
                  {STAGE_ORDER.map((stage) => (
                    <option key={stage.id} value={stage.id} className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white">
                      {stage.label} (Std LT: {stage.stdTime}d)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prod In / Prod Out Action Buttons */}
            <div className="flex justify-center gap-4 mt-2">
              {!isCompletedProduct && (
                <Button
                  type="submit"
                  size="lg"
                  className="font-bold rounded-lg px-10 py-3 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-white/90 border-none cursor-pointer"
                >
                  {isStageStarted ? "Complete Stage" : "Start Stage"}
                </Button>
              )}
              {isCompletedProduct && (
                <Button
                  type="button"
                  onClick={handleProdOut}
                  size="lg"
                  className="font-bold rounded-lg px-10 py-3 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-red-500/10 cursor-pointer bg-red-600 hover:bg-red-700 text-white border-none"
                  style={{
                    background: "#b91c1c",
                    color: "white",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = "#dc2626";
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = "#b91c1c";
                  }}
                >
                  Prod Out
                </Button>
              )}
            </div>
          </div>

          {/* ── Section 2: Product Status ── */}
          <div className="flex flex-col gap-6">
            <div className="border-b border-neutral-200 dark:border-neutral-900 pb-2">
              <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight">Product Status</h4>
            </div>

            {/* Row 1: 5 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="totalLeadTime">Total Lead Time</Label>
                <Input
                  id="totalLeadTime"
                  value={totalLeadTimeDisplay}
                  readOnly
                  placeholder="Computed status value"
                  className="bg-neutral-100/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-900 text-neutral-900 dark:text-neutral-350"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="currentLeadTime">Current Lead Time</Label>
                <Input
                  id="currentLeadTime"
                  value={currentLeadTimeDisplay}
                  readOnly
                  placeholder="Computed status value"
                  className="bg-neutral-100/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-900 text-neutral-900 dark:text-neutral-350"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="remainPoDays">Remain PO Days.</Label>
                <Input
                  id="remainPoDays"
                  value={remainPoDaysDisplay}
                  readOnly
                  placeholder="Computed remaining days"
                  className={`bg-neutral-100/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-900 transition-colors duration-200 ${
                    remainPoDaysDisplay.startsWith("Dispatched")
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold border-emerald-250 dark:border-emerald-950/30 bg-emerald-50/10 dark:bg-emerald-950/5"
                      : remainPoDaysDisplay && !isNaN(Number(remainPoDaysDisplay)) && Number(remainPoDaysDisplay) < 0
                      ? "text-rose-600 dark:text-rose-400 font-semibold border-rose-250 dark:border-rose-950/30 bg-rose-50/10 dark:bg-rose-950/5"
                      : "text-neutral-900 dark:text-neutral-350"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDateDisplay}
                  readOnly
                  className="[color-scheme:light] dark:[color-scheme:dark] bg-neutral-100/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-900 text-neutral-900 dark:text-neutral-350"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDateDisplay}
                  readOnly
                  className="[color-scheme:light] dark:[color-scheme:dark] bg-neutral-100/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-900 text-neutral-900 dark:text-neutral-350"
                />
              </div>
            </div>

            {/* Row 2: 4 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentOperation">Current Operation</Label>
                <Input
                  id="currentOperation"
                  value={currentOperationDisplay}
                  readOnly
                  placeholder="Current tracking stage"
                  className="bg-neutral-100/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-900 text-neutral-900 dark:text-neutral-350"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="inDateStatus">In Date (Status)</Label>
                <Input
                  id="inDateStatus"
                  type="datetime-local"
                  value={inDateStatus}
                  onChange={(e) => setInDateStatus(e.target.value)}
                  disabled={isStageStarted} // Lock In Date once started
                  className="[color-scheme:light] dark:[color-scheme:dark] bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-850 text-neutral-900 dark:text-neutral-300 disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="outDateStatus">Out Date (Status)</Label>
                <Input
                  id="outDateStatus"
                  type="datetime-local"
                  value={outDateStatus}
                  onChange={(e) => setOutDateStatus(e.target.value)}
                  disabled={!isStageStarted} // Lock Out Date until started
                  className="[color-scheme:light] dark:[color-scheme:dark] bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-850 text-neutral-900 dark:text-neutral-300 disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="remark">Remark</Label>
                <Input
                  id="remark"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Enter remarks"
                  className="bg-white/50 dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-850 text-neutral-900 dark:text-neutral-300"
                />
              </div>
              
              {operation && inDateStatus && outDateStatus && (() => {
                const stage = STAGE_ORDER.find((s) => s.id === operation);
                if (!stage) return null;
                const dIn = parseDateString(inDateStatus);
                const dOut = parseDateString(outDateStatus);
                if (dIn && dOut) {
                  const actualLT = diffInDays(dIn, dOut);
                  const diff = actualLT - stage.stdTime;
                  let bg = "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-450 border border-emerald-250/50 dark:border-emerald-900/30 font-medium";
                  let label = `Normal Status (Lead Time: ${actualLT}d / Std: ${stage.stdTime}d)`;
                  if (diff === 1) {
                    bg = "bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 font-medium";
                    label = `1 Day Overdue (Lead Time: ${actualLT}d / Std: ${stage.stdTime}d)`;
                  } else if (diff === 2) {
                    bg = "bg-rose-500/10 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-250/60 dark:border-rose-900/40 font-semibold";
                    label = `2 Days Overdue (Lead Time: ${actualLT}d / Std: ${stage.stdTime}d)`;
                  } else if (diff >= 3) {
                    bg = "bg-amber-950/15 text-amber-900 dark:bg-[rgb(67,40,24)]/35 dark:text-[rgb(217,162,112)] border border-amber-950/20 dark:border-[rgb(115,76,51)]/30 font-semibold";
                    label = `${diff} Days Overdue (Lead Time: ${actualLT}d / Std: ${stage.stdTime}d)`;
                  }
                  return (
                    <div className="col-span-full mt-4 p-4 rounded-xl backdrop-blur-md transition-all duration-300 animate-fade-in flex items-center justify-between border bg-white/70 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-900" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block mb-1">Stage Performance Metrics</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded text-xs font-semibold ${bg}`}>
                            {label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </form>

        {/* Stage History Timeline Tracker */}
        {loadedProduct && (() => {
          return (
            <div className="mt-10 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-neutral-950/20 backdrop-blur-md">
              <div className="border-b border-neutral-200 dark:border-neutral-900 pb-2 mb-6">
                <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight">Stage Tracking History</h4>
                <p className="text-xs text-neutral-500 mt-1">Lifecycle tracking logs for all production process stages</p>
              </div>
              <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-4 pl-6 flex flex-col gap-6">
                {STAGE_ORDER.map((stage) => {
                  const op = loadedProduct.operations[stage.id as keyof typeof loadedProduct.operations];
                  const hasIn = !!op.inTime;
                  const hasOut = !!op.outTime;
                  
                  // Color highlights
                  let dotColor = "bg-neutral-200 dark:bg-neutral-800 ring-neutral-100 dark:ring-neutral-900";
                  let bgClass = "bg-neutral-50 dark:bg-neutral-950/20 border-neutral-200/50 dark:border-neutral-900/50 text-neutral-500";
                  let statusLabel = "Pending";
                  
                  if (hasIn && hasOut) {
                    statusLabel = "Completed";
                    const diff = (op.leadTime ?? 0) - stage.stdTime;
                    if (diff === 1) {
                      dotColor = "bg-amber-500 ring-amber-500/20";
                      bgClass = "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400";
                    } else if (diff === 2) {
                      dotColor = "bg-rose-500 ring-rose-500/20";
                      bgClass = "bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-455";
                    } else if (diff >= 3) {
                      dotColor = "bg-amber-950 ring-amber-950/20";
                      bgClass = "bg-amber-950/5 border-amber-950/20 text-amber-900 dark:text-[rgb(217,162,112)]";
                    } else {
                      dotColor = "bg-emerald-500 ring-emerald-500/20";
                      bgClass = "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400";
                    }
                  } else if (hasIn) {
                    statusLabel = "In Progress";
                    const parsedIn = parseDateString(op.inTime!);
                    const elapsed = parsedIn ? diffInDays(parsedIn, new Date()) : 0;
                    const diff = elapsed - stage.stdTime;
                    if (diff === 1) {
                      dotColor = "bg-amber-500 ring-amber-500/20 animate-pulse";
                      bgClass = "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400 font-medium";
                    } else if (diff === 2) {
                      dotColor = "bg-rose-500 ring-rose-500/20 animate-pulse";
                      bgClass = "bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-455 font-medium";
                    } else if (diff >= 3) {
                      dotColor = "bg-amber-950 ring-amber-950/20 animate-pulse";
                      bgClass = "bg-amber-950/5 border-amber-950/20 text-amber-900 dark:text-[rgb(217,162,112)] font-medium";
                    } else {
                      dotColor = "bg-blue-500 ring-blue-500/20 animate-pulse";
                      bgClass = "bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-450 italic";
                    }
                  }
                  
                  return (
                    <div key={stage.id} className="relative flex flex-col gap-2">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ${dotColor}`} />
                      
                      {/* Stage card */}
                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${bgClass}`}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-neutral-900 dark:text-white">{stage.label}</span>
                            <span className="text-[10px] text-neutral-400 font-medium">(Std LT: {stage.stdTime}d)</span>
                          </div>
                          {hasIn && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1 text-neutral-500 dark:text-neutral-440">
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> In: {op.inTime}</span>
                              {hasOut && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Out: {op.outTime}</span>}
                              {op.operator && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Operator: {op.operator}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                          {hasIn && hasOut && op.leadTime !== undefined && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-200/50 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-300">
                              Lead Time: {op.leadTime}d
                            </span>
                          )}
                          {!hasOut && hasIn && (() => {
                            const parsedIn = parseDateString(op.inTime!);
                            const elapsed = parsedIn ? diffInDays(parsedIn, new Date()) : 0;
                            return (
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse">
                                Elapsed: {elapsed}d
                              </span>
                            );
                          })()}
                          <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded ${
                            statusLabel === "Completed"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : statusLabel === "In Progress"
                              ? "bg-blue-500/15 text-blue-600"
                              : "bg-neutral-200/50 dark:bg-neutral-800/80 text-neutral-400"
                          }`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] tracking-wider uppercase text-neutral-400 dark:text-neutral-700 mt-16">
         &copy; {new Date().getFullYear()} ProdTrack. All rights reserved.
      </footer>
    </main>
  );
}
