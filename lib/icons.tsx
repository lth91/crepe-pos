import {
  CakeSlice,
  Sandwich,
  IceCreamCone,
  CupSoda,
  Cherry,
  Search,
  X,
  ClipboardList,
  BarChart3,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  CheckCircle2,
  Lock,
  Loader2,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

export {
  Search,
  X,
  ClipboardList,
  BarChart3,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  CheckCircle2,
  Lock,
  Loader2,
  ArrowLeft,
  RotateCcw,
};

// Category icons as React components
const CAT_ICON_MAP: Record<string, React.FC<LucideProps>> = {
  "Sweet Crepes": CakeSlice,
  "Savory Crepes": Sandwich,
  "Ice Cream": IceCreamCone,
  Drinks: CupSoda,
  Topping: Cherry,
};

export function CategoryIcon({
  category,
  ...props
}: { category: string } & LucideProps) {
  const Icon = CAT_ICON_MAP[category];
  if (!Icon) return null;
  return <Icon {...props} />;
}
