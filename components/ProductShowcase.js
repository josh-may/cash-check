import Link from "next/link";

const ProductShowcase = () => {
  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6">
      <div className="text-center mb-6 sm:mb-8 md:mb-12 max-w-4xl mx-auto">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-sans font-semibold text-white mb-3 sm:mb-4 md:mb-5">
          Want More Details?
        </h3>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted">
          For a comprehensive breakdown of your cashflow, access your full
          interactive report. View income and expenses by category, analyze
          trends over time, and drill down into individual transactions.
        </p>
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div className="bg-surface rounded-lg sm:rounded-lg border border-line p-1.5 sm:p-3 shadow-none">
          <div className="bg-surface rounded-lg sm:rounded-lg overflow-hidden">
            {/* Browser Chrome */}
            <div className="bg-surface border-b border-line px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
              <div className="flex gap-2 sm:gap-2.5">
                <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-negative rounded-full"></div>
                <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-yellow-500 rounded-full"></div>
                <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-positive rounded-full"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-canvas rounded-md px-3 sm:px-5 py-1 sm:py-1.5 text-xs sm:text-sm text-muted font-sans">
                  localhost:3000/app
                </div>
              </div>
            </div>

            {/* Dashboard Preview - Matching report.js style */}
            <div className="p-4 sm:p-8 md:p-10 lg:p-12 bg-surface space-y-6 sm:space-y-8 md:space-y-10 overflow-x-auto">
              {/* Summary Stats */}
              <p className="text-muted mb-6 sm:mb-8 text-sm sm:text-base md:text-lg pt-5">
                Your average monthly income is{" "}
                <span className="text-white font-semibold">$6,166</span>,
                expenses{" "}
                <span className="text-white font-semibold">$5,074</span>,
                and net cashflow{" "}
                <span className="text-positive font-semibold">$1,092</span>
                .
              </p>

              {/* Main Table */}
              <div className="bg-surface rounded-lg sm:rounded-lg border border-line overflow-hidden shadow-none min-w-[500px] sm:min-w-[600px]">
                <table className="data-table w-full font-sans text-xs sm:text-sm md:text-base">
                  <thead>
                    <tr className="bg-surface">
                      <th
                        colSpan="8"
                        className="text-left p-3 sm:p-4 text-white font-bold text-sm sm:text-base md:text-lg"
                      >
                        Main
                      </th>
                    </tr>
                    <tr>
                      <th className="text-left p-2 sm:p-3 md:p-4 w-16 sm:w-20 md:w-24 text-muted font-medium border-r border-line"></th>
                      <th className="text-left p-2 sm:p-3 md:p-4 min-w-[60px] sm:min-w-[80px] md:min-w-[90px] font-semibold text-white border-r border-line cursor-pointer hover:text-white hover:bg-line transition-colors">
                        Jan
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 min-w-[60px] sm:min-w-[80px] md:min-w-[90px] font-semibold text-white border-r border-line cursor-pointer hover:text-white hover:bg-line transition-colors">
                        Feb
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 min-w-[60px] sm:min-w-[80px] md:min-w-[90px] font-semibold text-white border-r border-line cursor-pointer hover:text-white hover:bg-line transition-colors">
                        Mar
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 min-w-[60px] sm:min-w-[80px] md:min-w-[90px] font-semibold text-white border-r border-line cursor-pointer hover:text-white hover:bg-line transition-colors">
                        Apr
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 min-w-[60px] sm:min-w-[80px] md:min-w-[90px] font-semibold text-white border-r border-line cursor-pointer hover:text-white hover:bg-line transition-colors">
                        May
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 min-w-[60px] sm:min-w-[80px] md:min-w-[90px] font-semibold text-white border-r border-line cursor-pointer hover:text-white hover:bg-line transition-colors">
                        Jun
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 min-w-[60px] sm:min-w-[80px] md:min-w-[90px] font-semibold text-white cursor-pointer hover:text-white hover:bg-line transition-colors">
                        Jul
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-line">
                      <td className="p-2 sm:p-3 md:p-4 font-semibold text-muted border-r border-line text-xs sm:text-sm">
                        Income
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $5,734.50
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $5,392.75
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $5,950.00
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $5,625.80
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $5,475.25
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $5,818.40
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white tabular-nums">
                        $5,589.90
                      </td>
                    </tr>
                    <tr className="border-t border-line">
                      <td className="p-2 sm:p-3 md:p-4 font-semibold text-muted border-r border-line text-xs sm:text-sm">
                        Expenses
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $4,623.45
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $4,396.30
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $4,734.75
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $4,487.60
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $4,656.80
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white border-r border-line tabular-nums">
                        $4,545.20
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 text-white tabular-nums">
                        $4,423.15
                      </td>
                    </tr>
                    <tr className="border-t border-line bg-surface">
                      <td className="p-2 sm:p-3 md:p-4 font-semibold text-white border-r border-line text-xs sm:text-sm">
                        Net
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 font-semibold border-r border-line tabular-nums text-positive">
                        $1,111.05
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 font-semibold border-r border-line tabular-nums text-positive">
                        $996.45
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 font-semibold border-r border-line tabular-nums text-positive">
                        $1,215.25
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 font-semibold border-r border-line tabular-nums text-positive">
                        $1,138.20
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 font-semibold border-r border-line tabular-nums text-positive">
                        $818.45
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 font-semibold border-r border-line tabular-nums text-positive">
                        $1,273.20
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 font-semibold tabular-nums text-positive">
                        $1,166.75
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Side Projects Table */}
              <div className="bg-surface rounded-lg sm:rounded-lg border border-line overflow-hidden shadow-none min-w-[500px] sm:min-w-[600px]">
                <table className="data-table w-full font-sans text-xs sm:text-sm md:text-base">
                  <thead>
                    <tr className="bg-surface">
                      <th
                        colSpan="8"
                        className="text-left p-3 sm:p-4 md:p-5 text-white font-bold"
                      >
                        Side Projects
                      </th>
                    </tr>
                    <tr>
                      <th className="text-left p-2 sm:p-3 md:p-4 lg:p-5 w-20 sm:w-28 md:w-32 lg:w-36 text-muted font-medium border-r border-line"></th>
                      <th className="text-left p-2 sm:p-3 md:p-4 lg:p-5 min-w-[60px] sm:min-w-[90px] md:min-w-[120px] font-semibold text-white border-r border-line">
                        Jan
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 lg:p-5 min-w-[60px] sm:min-w-[90px] md:min-w-[120px] font-semibold text-white border-r border-line">
                        Feb
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 lg:p-5 min-w-[60px] sm:min-w-[90px] md:min-w-[120px] font-semibold text-white border-r border-line">
                        Mar
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 lg:p-5 min-w-[60px] sm:min-w-[90px] md:min-w-[120px] font-semibold text-white border-r border-line">
                        Apr
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 lg:p-5 min-w-[60px] sm:min-w-[90px] md:min-w-[120px] font-semibold text-white border-r border-line">
                        May
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 lg:p-5 min-w-[60px] sm:min-w-[90px] md:min-w-[120px] font-semibold text-white border-r border-line">
                        Jun
                      </th>
                      <th className="text-left p-2 sm:p-3 md:p-4 lg:p-5 min-w-[60px] sm:min-w-[90px] md:min-w-[120px] font-semibold text-white">
                        Jul
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-line">
                      <td className="p-2 sm:p-3 md:p-4 lg:p-5 font-semibold text-muted border-r border-line">
                        Income
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $485.75
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $523.40
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $492.15
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $508.90
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $476.25
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $515.30
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white tabular-nums">
                        $499.50
                      </td>
                    </tr>
                    <tr className="border-t border-line">
                      <td className="p-2 sm:p-3 md:p-4 lg:p-5 font-semibold text-muted border-r border-line">
                        Expenses
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $512.30
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $487.65
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $506.40
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $495.80
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $478.95
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white border-r border-line tabular-nums">
                        $521.15
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 text-white tabular-nums">
                        $510.20
                      </td>
                    </tr>
                    <tr className="border-t border-line bg-surface">
                      <td className="p-2 sm:p-3 md:p-4 lg:p-5 font-semibold text-white border-r border-line">
                        Net
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 font-semibold border-r border-line tabular-nums text-negative">
                        -$26.55
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 font-semibold border-r border-line tabular-nums text-positive">
                        $35.75
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 font-semibold border-r border-line tabular-nums text-negative">
                        -$14.25
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 font-semibold border-r border-line tabular-nums text-positive">
                        $13.10
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 font-semibold border-r border-line tabular-nums text-negative">
                        -$2.70
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 font-semibold border-r border-line tabular-nums text-negative">
                        -$5.85
                      </td>
                      <td className="text-left p-2 sm:p-3 md:p-4 lg:p-5 font-semibold tabular-nums text-negative">
                        -$10.70
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative gradient blur */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 to-blue-400/5 blur-3xl -z-10"></div>
      </div>
    </section>
  );
};

export default ProductShowcase;