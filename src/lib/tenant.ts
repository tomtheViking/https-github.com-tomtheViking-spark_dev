/**
 * Multi-Tenant CRM Partition Utilities
 * 
 * Maps customer names to deterministic and unique tenant IDs, matching the Support Dashboard
 * mapping for standard seeds, and generating new unique tenant IDs for any newly created customers.
 */

const assignedTenants = new Map<string, string>([
  ["arachnid", "Tenant_ID_101"],
  ["phil muffins", "Tenant_ID_101"],
  ["muffin", "Tenant_ID_102"],
  ["equine", "Tenant_ID_103"],
  ["liz gallop", "Tenant_ID_103"],
  ["snail", "Tenant_ID_104"],
  ["sarah jenkins", "Tenant_ID_104"],
  ["sarah jennings", "Tenant_ID_104"]
]);

let nextTenantNum = 105;

export function getTenantIdForCustomer(customerName: string): string {
  if (!customerName) return "Tenant_ID_Pending";
  
  const name = customerName.toLowerCase();
  
  for (const [key, value] of assignedTenants.entries()) {
    if (name.includes(key)) {
      return value;
    }
  }
  
  const normalized = name.trim();
  if (assignedTenants.has(normalized)) {
    return assignedTenants.get(normalized)!;
  }
  
  const newId = `Tenant_ID_${nextTenantNum}`;
  assignedTenants.set(normalized, newId);
  nextTenantNum++;
  return newId;
}

export function getTenantNameForCustomer(customerName: string): string {
  if (!customerName) return "Pending Tenant";
  
  const name = customerName.toLowerCase();
  if (name.includes("arachnid") || name.includes("phil muffins")) {
    return "Arachnid Systems";
  }
  if (name.includes("muffin")) {
    return "Muffin & Sons Brands";
  }
  if (name.includes("equine") || name.includes("liz gallop")) {
    return "Equine Digital Group";
  }
  if (name.includes("snail") || name.includes("sarah jenkins") || name.includes("sarah jennings")) {
    return "SnailCare Logistics";
  }
  
  // Clean up parenthesis (e.g. "Robert Vance (CFO, Vance Retail)" -> "Vance Retail")
  const parenMatch = customerName.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const parts = parenMatch[1].split(",");
    const company = parts[parts.length - 1].trim();
    if (company && company.toLowerCase() !== "cfo" && company.toLowerCase() !== "director" && company.toLowerCase() !== "vp") {
      return company;
    }
  }
  
  return customerName.replace(/\s*\(.*\)\s*/g, "").trim() + " Enterprise";
}

export function getTenantNameById(tenantId?: string): string {
  if (!tenantId) return "Representative Workspace";
  if (tenantId === "Tenant_ID_101") return "Arachnid Systems";
  if (tenantId === "Tenant_ID_102") return "Muffin & Sons Brands";
  if (tenantId === "Tenant_ID_103") return "Equine Digital Group";
  if (tenantId === "Tenant_ID_104") return "SnailCare Logistics";
  return "Representative Workspace";
}

