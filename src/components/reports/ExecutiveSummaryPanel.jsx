import React from "react";
import ExecutiveSummary from "@/components/reports/ui/ExecutiveSummary";

function ExecutiveSummaryPanel(props) {
  return <ExecutiveSummary {...props} />;
}

export default React.memo(ExecutiveSummaryPanel);
