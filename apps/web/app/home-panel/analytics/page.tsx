"use client";
import { useState } from "react";
import { Search, CheckCircle2, AlertTriangle, Play, HelpCircle, Download, LayoutDashboard, Clock } from "lucide-react";
import { useProducts, OperationStatus, parseDateString, diffInDays, STAGE_ORDER } from "../../../context/ProductContext";

export default function AnalyticsPage() {
  const { products, getNextRequiredStage } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      p.itemNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.woNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to check if a product is delayed in any stage (completed or in progress)
  const isProductDelayed = (p: typeof products[number]) => {
    for (const stage of STAGE_ORDER) {
      const op = p.operations[stage.id as keyof typeof p.operations];
      if (op.inTime) {
        if (op.leadTime !== undefined) {
          if (op.leadTime - op.stdTime >= 1) return true;
        } else {
          // In progress check: elapsed time > stdTime
          const parsedIn = parseDateString(op.inTime);
          if (parsedIn) {
            const elapsed = diffInDays(parsedIn, new Date());
            if (elapsed - op.stdTime >= 1) return true;
          }
        }
      }
    }
    return false;
  };

  // Helper to get operation status style classes based on new exact business rules:
  // - Within target lead time: Green for completed, Light Blue for in-progress
  // - 1 day overdue: Yellow
  // - 2 days overdue: Red
  // - 3 or more days overdue: Dark Brown
  const getOpCellClass = (op: OperationStatus) => {
    if (!op.inTime) return "bg-transparent text-neutral-450 dark:text-neutral-600";
    
    // In progress handling (check active/current delay based on new Date())
    if (op.leadTime === undefined) {
      const parsedIn = parseDateString(op.inTime);
      if (parsedIn) {
        const elapsed = diffInDays(parsedIn, new Date());
        const diff = elapsed - op.stdTime;
        if (diff === 1) {
          return "bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 font-medium animate-pulse";
        } else if (diff === 2) {
          return "bg-rose-500/10 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-250/60 dark:border-rose-900/40 font-semibold animate-pulse";
        } else if (diff >= 3) {
          return "bg-amber-950/15 text-amber-900 dark:bg-[rgb(67,40,24)]/35 dark:text-[rgb(217,162,112)] border border-amber-950/20 dark:border-[rgb(115,76,51)]/30 font-semibold animate-pulse";
        }
      }
      // Active & Within standard lead time -> Subtle light blue to indicate on-going standard task
      return "bg-blue-500/5 text-blue-650 dark:bg-blue-500/5 dark:text-blue-450 border border-blue-200/40 dark:border-blue-900/20 italic font-medium";
    }
    
    const diff = op.leadTime - op.stdTime;
    if (diff === 1) {
      // Exceeds standard lead time by exactly 1 day -> Yellow
      return "bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 font-medium";
    } else if (diff === 2) {
      // Exceeds standard lead time by exactly 2 days -> Red
      return "bg-rose-500/10 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-250/60 dark:border-rose-900/40 font-semibold";
    } else if (diff >= 3) {
      // Exceeds standard lead time by 3 or more days -> Dark Brown
      return "bg-amber-950/15 text-amber-900 dark:bg-[rgb(67,40,24)]/35 dark:text-[rgb(217,162,112)] border border-amber-950/20 dark:border-[rgb(115,76,51)]/30 font-semibold";
    }
    // Completed on or ahead of time (Within standard lead time) -> Highlight Green!
    return "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-450 border border-emerald-250/50 dark:border-emerald-900/30 font-medium";
  };

  // Count telemetry metrics based on active context products
  const totalProducts = products.length;
  const completedProducts = products.filter((p) => p.operations.dispatch.outTime).length;
  const inProgressProducts = totalProducts - completedProducts;
  const delayedProductsCount = products.filter(isProductDelayed).length;

  // Averages calculations
  const currentLeadTimes = products
    .map((p) => p.currentLeadTime)
    .filter((lt): lt is number => lt !== undefined);
  const avgCurrentLeadTime = currentLeadTimes.length > 0
    ? (currentLeadTimes.reduce((a, b) => a + b, 0) / currentLeadTimes.length).toFixed(1)
    : "-";

  const totalLeadTimes = products
    .map((p) => p.totalLeadTime)
    .filter((lt): lt is number => lt !== undefined);
  const avgTotalLeadTime = totalLeadTimes.length > 0
    ? (totalLeadTimes.reduce((a, b) => a + b, 0) / totalLeadTimes.length).toFixed(1)
    : "-";

  const remainingDaysValues = products
    .filter((p) => !p.operations.dispatch.outTime && p.remainingDays !== undefined && !isNaN(Number(p.remainingDays)))
    .map((p) => Number(p.remainingDays));
  const avgRemainingDays = remainingDaysValues.length > 0
    ? (remainingDaysValues.reduce((a, b) => a + b, 0) / remainingDaysValues.length).toFixed(1)
    : "-";

  // Stage-wise product counts
  const stageCounts = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  products.forEach((p) => {
    const nextStage = getNextRequiredStage(p);
    if (nextStage) {
      stageCounts[nextStage.id] = (stageCounts[nextStage.id] || 0) + 1;
    }
  });

  const downloadExcelReport = () => {
    const title = "Regular Arbor (EN24/H13)";
    
    // Row 1: Title and Std LT values
    let row1 = "<tr>";
    row1 += `<td colspan="14" style="font-weight: bold; font-size: 12pt; text-align: left; background-color: #ffffff; border: 0.5pt solid #000000; padding: 6px;">${title}</td>`;
    row1 += `<td style="font-weight: bold; text-align: right; background-color: #ffffff; border: 0.5pt solid #000000; padding: 6px;">Std LT&gt;&gt;&gt;</td>`;
    STAGE_ORDER.forEach((stage) => {
      row1 += `<td style="font-weight: bold; text-align: center; background-color: #f2f2f2; border: 0.5pt solid #000000; padding: 6px;">${stage.stdTime}</td>`;
    });
    row1 += '<td style="background-color: #ffffff; border: 0.5pt solid #000000; padding: 6px;"></td>';
    row1 += "</tr>";

    // Row 2: Headers
    const headers = [
      "Last exec.", "Item no", "Desc", "PO no", "Line no", "PO date", "PO confirm del date",
      "Remaining days to disp material", "Std. Lead time", "W/O no", "Start date", "End date",
      "Total lead time", "Current lead time",
      ...STAGE_ORDER.map(s => s.label),
      "Remark"
    ];
    
    let row2 = "<tr>";
    headers.forEach(h => {
      row2 += `<th style="background-color: #d9e1f2; font-weight: bold; text-align: center; border: 0.5pt solid #000000; padding: 6px;">${h}</th>`;
    });
    row2 += "</tr>";

    // Data rows
    let dataRows = "";
    filteredProducts.forEach(p => {
      let row = "<tr>";
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px;">${p.lastExec || ""}</td>`;
      
      const itemNoStyle = p.itemNoStyle === "critical" ? "color: #ff0000; font-weight: bold;" : "";
      row += `<td style="text-align: left; border: 0.5pt solid #000000; padding: 6px; ${itemNoStyle}">${p.itemNo || ""}</td>`;
      row += `<td style="text-align: left; border: 0.5pt solid #000000; padding: 6px; font-family: monospace;">${p.desc || ""}</td>`;
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px;">${p.poNo || ""}</td>`;
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px;">${p.lineNo ?? ""}</td>`;
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px;">${p.poDate || ""}</td>`;
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px;">${p.poConfirmDelDate || ""}</td>`;
      
      let remStyle = "";
      if (p.remainingStyle === "success") {
        remStyle = "background-color: #c6efce; color: #006100; font-weight: bold; text-align: center; padding: 6px;";
      } else if (p.remainingStyle === "warning") {
        remStyle = "background-color: #ffc7ce; color: #9c0006; font-weight: bold; text-align: center; padding: 6px;";
      } else {
        remStyle = "text-align: center; padding: 6px;";
      }
      row += `<td style="border: 0.5pt solid #000000; ${remStyle}">${p.remainingDays !== undefined ? p.remainingDays : ""}</td>`;
      
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px;">${p.stdLeadTime ?? ""}</td>`;
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px; font-weight: bold;">${p.woNo || ""}</td>`;
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px;">${p.startDate || ""}</td>`;
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px;">${p.endDate || ""}</td>`;
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px; font-weight: bold;">${p.totalLeadTime !== undefined ? p.totalLeadTime : ""}</td>`;
      row += `<td style="text-align: center; border: 0.5pt solid #000000; padding: 6px; font-weight: bold;">${p.currentLeadTime !== undefined ? p.currentLeadTime : ""}</td>`;
      
      STAGE_ORDER.forEach(stage => {
        const op = p.operations[stage.id as keyof typeof p.operations];
        let cellStyle = "text-align: center; font-size: 9pt; border: 0.5pt solid #000000; padding: 6px;";
        let cellVal = "";
        
        if (op && op.inTime) {
          const cellLines = [];
          cellLines.push(`In: ${op.inTime}`);
          if (op.outTime) {
            cellLines.push(`Out: ${op.outTime}`);
          }
          if (op.leadTime !== undefined) {
            cellLines.push(`Lead time: ${op.leadTime}`);
          }
          
          cellVal = cellLines.join("<br/>");
          
          if (op.leadTime === undefined) {
            const parsedIn = parseDateString(op.inTime);
            if (parsedIn) {
              const elapsed = diffInDays(parsedIn, new Date());
              const diff = elapsed - op.stdTime;
              if (diff === 1) {
                cellStyle += "background-color: #ffeb9c; color: #9c6500; font-weight: bold;";
              } else if (diff === 2) {
                cellStyle += "background-color: #ffc7ce; color: #9c0006; font-weight: bold;";
              } else if (diff >= 3) {
                cellStyle += "background-color: #e2c0b0; color: #632509; font-weight: bold;";
              } else {
                cellStyle += "background-color: #c9daf8; color: #1e3a8a; font-style: italic;";
              }
            }
          } else {
            const diff = op.leadTime - op.stdTime;
            if (diff === 1) {
              cellStyle += "background-color: #ffeb9c; color: #9c6500; font-weight: bold;";
            } else if (diff === 2) {
              cellStyle += "background-color: #ffc7ce; color: #9c0006; font-weight: bold;";
            } else if (diff >= 3) {
              cellStyle += "background-color: #e2c0b0; color: #632509; font-weight: bold;";
            } else {
              cellStyle += "background-color: #c6efce; color: #006100; font-weight: bold;";
            }
          }
        } else {
          cellVal = "Pending";
          cellStyle += "color: #a3a3a3; font-style: italic;";
        }
        
        row += `<td style="${cellStyle}">${cellVal}</td>`;
      });
      
      let remarkStyle = "text-align: left; font-weight: bold; border: 0.5pt solid #000000; padding: 6px;";
      if (p.remark === "Dispatched") {
        remarkStyle += "color: #006100;";
      } else {
        remarkStyle += "color: #9c6500;";
      }
      row += `<td style="${remarkStyle}">${p.remark || ""}</td>`;
      row += "</tr>";
      dataRows += row;
    });

    const htmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>ProdTrack Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; }
          th, td { border: 0.5pt solid #000000; font-family: 'Segoe UI', Calibri, sans-serif; font-size: 10pt; height: 32px; }
        </style>
      </head>
      <body>
        <table>
          ${row1}
          ${row2}
          ${dataRows}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prodtrack_report_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden bg-transparent text-neutral-900 dark:text-white transition-colors duration-500">
      <div className="w-full flex flex-col justify-start flex-1">
        
        {/* Page title and description */}
        <div className="flex flex-col gap-1 pb-4 border-b border-neutral-200 dark:border-neutral-900 mb-8">
          <h3 className="text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">Analytics Dashboard</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-450">Track standard vs actual lead times across product stages</p>
        </div>

        {/* Dashboard Metrics Grid (8 KPI Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-neutral-950/30 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Total Products</span>
              <h4 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{totalProducts}</h4>
            </div>
            <LayoutDashboard className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-neutral-950/30 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">In Progress</span>
              <h4 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{inProgressProducts} Items</h4>
            </div>
            <Play className="h-5 w-5 text-amber-500 dark:text-amber-400 animate-pulse" />
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-neutral-950/30 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Completed Products</span>
              <h4 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{completedProducts} Items</h4>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-650 dark:text-emerald-400" />
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-neutral-950/30 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Delayed Products</span>
              <h4 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-450">{delayedProductsCount} Items</h4>
            </div>
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-neutral-950/30 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Avg Current LT</span>
              <h4 className="text-2xl font-bold mt-1 text-neutral-750 dark:text-neutral-300">{avgCurrentLeadTime !== "-" ? `${avgCurrentLeadTime}d` : "-"}</h4>
            </div>
            <Clock className="h-5 w-5 text-neutral-500" />
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-neutral-950/30 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Avg Total LT</span>
              <h4 className="text-2xl font-bold mt-1 text-neutral-750 dark:text-neutral-300">{avgTotalLeadTime !== "-" ? `${avgTotalLeadTime}d` : "-"}</h4>
            </div>
            <Clock className="h-5 w-5 text-neutral-500" />
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-neutral-950/30 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Avg Remaining Days</span>
              <h4 className="text-2xl font-bold mt-1 text-neutral-750 dark:text-neutral-300">{avgRemainingDays !== "-" ? `${avgRemainingDays}d` : "-"}</h4>
            </div>
            <HelpCircle className="h-5 w-5 text-neutral-500" />
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-neutral-950/30 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">System State</span>
              <h4 className="text-md font-bold mt-1.5 text-emerald-650 dark:text-emerald-450">99.98% Active</h4>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        {/* Stage-wise Product Distribution Tracker */}
        <div className="mb-8 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white/50 dark:bg-neutral-950/20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-200 dark:border-neutral-900 pb-2">
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Stage-wise Product Distribution</h4>
            <span className="text-[10px] text-neutral-500 font-medium">Active product count in each operational stage</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-11 gap-3.5 mt-2">
            {STAGE_ORDER.map((stage) => {
              const count = stageCounts[stage.id] || 0;
              return (
                <div key={stage.id} className={`p-3 rounded-xl border flex flex-col gap-1 items-center text-center transition-all duration-300 ${
                  count > 0 
                    ? "bg-blue-500/[0.04] border-blue-500/35 text-blue-650 dark:bg-blue-500/[0.02] dark:border-blue-900/40 dark:text-blue-400 font-semibold"
                    : "bg-neutral-50 dark:bg-neutral-950/10 border-neutral-200/50 dark:border-neutral-900/40 text-neutral-400"
                }`}>
                  <span className="text-[10px] font-medium leading-tight line-clamp-1 w-full" title={stage.label}>{stage.label}</span>
                  <div className={`text-lg font-extrabold mt-1 h-8 w-8 rounded-full flex items-center justify-center ${
                    count > 0 
                      ? "bg-blue-500/10 dark:bg-blue-500/25 text-blue-600 dark:text-blue-400 animate-pulse" 
                      : "bg-neutral-100 dark:bg-neutral-900 text-neutral-400"
                  }`}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottleneck Products Widget */}
        {(() => {
          const bottleneckProducts = products.filter(isProductDelayed);
          if (bottleneckProducts.length === 0) return null;
          return (
            <div className="mb-8 p-5 rounded-2xl border border-rose-200 dark:border-rose-950/30 bg-rose-50/10 dark:bg-rose-950/[0.02] backdrop-blur-md relative overflow-hidden shadow-xs">
              <div
                className="absolute -right-20 -top-20 w-44 h-44 rounded-full pointer-events-none filter blur-3xl opacity-30 animate-pulse"
                style={{
                  background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)",
                }}
              />
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Active Production Bottlenecks ({bottleneckProducts.length})</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {bottleneckProducts.map((p, bIdx) => {
                  let delayedStageLabel = "";
                  let delayDays = 0;
                  let isInProgress = false;

                  for (const stage of STAGE_ORDER) {
                    const op = p.operations[stage.id as keyof typeof p.operations];
                    if (op.inTime) {
                      if (op.leadTime !== undefined) {
                        const diff = op.leadTime - op.stdTime;
                        if (diff >= 1) {
                          delayedStageLabel = stage.label;
                          delayDays = diff;
                          isInProgress = false;
                        }
                      } else {
                        const parsedIn = parseDateString(op.inTime);
                        if (parsedIn) {
                          const elapsed = diffInDays(parsedIn, new Date());
                          const diff = elapsed - op.stdTime;
                          if (diff >= 1) {
                            delayedStageLabel = stage.label;
                            delayDays = diff;
                            isInProgress = true;
                          }
                        }
                      }
                    }
                  }

                  return (
                    <div key={bIdx} className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white/70 hover:bg-neutral-100/70 dark:bg-neutral-950/40 dark:hover:bg-neutral-950/80 transition-all duration-200 shadow-2xs">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-bold tracking-tight bg-rose-100 dark:bg-rose-950/30 px-1.5 py-0.5 rounded">
                            {p.itemNo}
                          </span>
                          <h5 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">{p.desc}</h5>
                        </div>
                        <span className="text-[9px] text-neutral-500 font-semibold">W/O: {p.woNo}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-900/60 text-[10px]">
                        <span className="text-neutral-500">Stuck at: <strong className="text-neutral-700 dark:text-neutral-200">{delayedStageLabel}</strong></span>
                        <span className={`font-semibold ${delayDays >= 3 ? "text-[rgb(217,162,112)]" : delayDays === 2 ? "text-rose-600 dark:text-rose-450" : "text-yellow-600 dark:text-yellow-450"}`}>
                          {delayDays}d overdue {isInProgress && "(In Prog)"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-5">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Item No, PO, W/O..."
                className="w-full h-9 pl-9 pr-4 rounded-md border border-neutral-200 dark:border-neutral-850 bg-white/50 dark:bg-neutral-900/40 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors duration-200 shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={downloadExcelReport}
              className="flex items-center gap-2 font-semibold text-xs rounded-md px-3.5 h-9 border border-neutral-200 dark:border-neutral-850 bg-white hover:bg-neutral-100 text-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer shadow-2xs hover:shadow-xs transition-all duration-200"
            >
              <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Export Report
            </button>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-neutral-500 dark:text-neutral-440 select-none">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" /> Completed (Within Std LT)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500/20 border border-blue-500/50" /> Active (Within Std LT)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" /> Overdue (1 day)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500/20 border border-rose-500/50" /> Overdue (2 days)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[rgb(115,76,51)]/20 border border-[rgb(115,76,51)]/50" /> Critical Overdue (&gt;=3 days)</span>
          </div>
        </div>

        {/* Scrollable grid console for massive columns */}
        <div className="w-full rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white/60 dark:bg-neutral-950/40 overflow-hidden shadow-sm" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.05)" }}>
          <div className="overflow-x-auto w-full scrollbar-thin scrollbar-track-neutral-100 dark:scrollbar-track-neutral-950 scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-800">
            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
              
              {/* Outer Headers */}
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-900 bg-neutral-100/60 dark:bg-neutral-950/50 font-semibold text-neutral-500">
                  <th colSpan={14} className="px-4 py-2 border-r border-neutral-200 dark:border-r-neutral-900 text-[10px] tracking-wider uppercase text-neutral-500">Product Info & Telemetry</th>
                  <th colSpan={11} className="px-4 py-2 text-center text-[10px] tracking-wider uppercase text-indigo-650 dark:text-indigo-400 border-r border-neutral-200 dark:border-r-neutral-900">
                    Operation Tracking (Std Lead Time in Days)
                  </th>
                  <th className="px-4 py-2 text-[10px] tracking-wider uppercase text-neutral-500">Status</th>
                </tr>
                <tr className="border-b border-neutral-200 dark:border-neutral-900 bg-neutral-100/20 dark:bg-neutral-900/10 text-neutral-600 dark:text-neutral-300 font-semibold text-[11px]">
                  {/* Base columns */}
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">Last exec.</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">Item no</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">Desc</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">PO no</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">Line no</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">PO date</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">PO confirm del date</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">Remaining days</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">Std. LT</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">W/O no</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">Start date</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">End date</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">Total LT</th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">Current LT</th>
                  
                  {/* Operation subheaders with standard lead times */}
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">List provided <span className="block text-[9px] text-neutral-500">Std LT: 1</span></th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">Cutting completed <span className="block text-[9px] text-neutral-500">Std LT: 1</span></th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">Rough turning 1 <span className="block text-[9px] text-neutral-500">Std LT: 3</span></th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">Rough turning 2 <span className="block text-[9px] text-neutral-500">Std LT: 3</span></th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">Heat treatment <span className="block text-[9px] text-neutral-500">Std LT: 7</span></th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">Finish 1st <span className="block text-[9px] text-neutral-500">Std LT: 3</span></th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">Finish 2nd <span className="block text-[9px] text-neutral-500">Std LT: 2</span></th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">Slotting <span className="block text-[9px] text-neutral-500">Std LT: 2</span></th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">Inspection <span className="block text-[9px] text-neutral-500">Std LT: 1</span></th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">RFD <span className="block text-[9px] text-neutral-500">Std LT: 1</span></th>
                  <th className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">Dispatch <span className="block text-[9px] text-neutral-500">Std LT: 1</span></th>

                  <th className="px-3 py-3">Remark</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900 text-neutral-800 dark:text-neutral-300">
                {filteredProducts.map((p, idx) => {
                  const isDelayed = isProductDelayed(p);
                  return (
                    <tr key={idx} className={`transition-colors duration-150 ${isDelayed ? "bg-rose-50/20 dark:bg-rose-950/[0.04] hover:bg-rose-100/40 dark:hover:bg-rose-950/[0.07] border-l border-rose-500" : "hover:bg-neutral-100/50 dark:hover:bg-neutral-900/20"}`}>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">{p.lastExec}</td>
                    <td className={`px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 font-semibold ${p.itemNoStyle === "critical" ? "text-red-600 dark:text-red-400" : "text-neutral-950 dark:text-white"}`}>
                      {p.itemNo}
                    </td>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-neutral-500 dark:text-neutral-440 font-mono text-[11px]">{p.desc}</td>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">{p.poNo}</td>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900">{p.lineNo}</td>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-neutral-500 dark:text-neutral-440">{p.poDate}</td>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-neutral-500 dark:text-neutral-440">{p.poConfirmDelDate || "-"}</td>
                    
                    <td className={`px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center font-medium ${
                      p.remainingStyle === "success" 
                        ? "bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-l border-emerald-250 dark:border-l-emerald-900/30" 
                        : p.remainingStyle === "warning" 
                        ? "bg-rose-500/10 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-l border-rose-250 dark:border-l-rose-900/30" 
                        : ""
                    }`}>
                      {p.remainingDays !== undefined ? p.remainingDays : "-"}
                    </td>

                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center">{p.stdLeadTime || "-"}</td>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-neutral-900 dark:text-white font-semibold">{p.woNo}</td>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-neutral-500 dark:text-neutral-440">{p.startDate || "-"}</td>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-neutral-500 dark:text-neutral-440">{p.endDate || "-"}</td>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center font-bold text-neutral-950 dark:text-white">
                      {p.totalLeadTime !== undefined ? `${p.totalLeadTime}d` : "-"}
                    </td>
                    <td className="px-3 py-3 border-r border-neutral-200 dark:border-r-neutral-900 text-center font-bold text-neutral-950 dark:text-white">
                      {p.currentLeadTime !== undefined ? `${p.currentLeadTime}d` : "-"}
                    </td>

                    {Object.values(p.operations).map((opData, opIdx) => {
                      const typedOp = opData as OperationStatus;
                      return (
                        <td key={opIdx} className={`px-2.5 py-1.5 border-r border-neutral-200 dark:border-r-neutral-900 text-center transition-colors duration-200 ${getOpCellClass(typedOp)}`}>
                          {typedOp.inTime ? (
                            <div className="flex flex-col text-[10px] leading-tight">
                              <span className="opacity-90">In: {typedOp.inTime}</span>
                              {typedOp.outTime && <span className="opacity-95">Out: {typedOp.outTime}</span>}
                              {typedOp.leadTime !== undefined && (
                                <span className="font-semibold mt-0.5 border-t border-current/15 dark:border-current/10 pt-0.5">
                                  Lead: {typedOp.leadTime}d
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-450 dark:text-neutral-600 italic">Pending</span>
                          )}
                        </td>
                      );
                    })}

                    <td className={`px-3 py-3 font-semibold ${p.remark === "Dispatched" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {p.remark || "-"}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty state if search returns nothing */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-10 border border-neutral-200 dark:border-neutral-900 bg-white/20 dark:bg-neutral-950/20 rounded-xl mt-4">
            <p className="text-sm text-neutral-500">No tracking records found matching your query.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] tracking-wider uppercase text-neutral-400 dark:text-neutral-700 mt-16">
         &copy; {new Date().getFullYear()} ProdTrack. All rights reserved.
      </footer>
    </main>
  );
}
