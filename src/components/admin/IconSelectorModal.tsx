"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faArrowTrendUp,
  faBriefcase,
  faBuildingColumns,
  faShieldHalved,
  faChartLine,
  faUserCheck,
  faScaleUnbalancedFlip,
  faCoins,
  faHandHoldingDollar,
  faPercent,
  faPiggyBank,
  faVault,
  faGlobe,
  faLaptopCode,
  faGraduationCap,
  faClock,
  faPhone,
  faEnvelope,
  faMapLocationDot,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

interface IconItem {
  name: string;
  icon: any;
  label: string;
}

export const ICON_LIBRARY: IconItem[] = [
  { name: "faArrowTrendUp", icon: faArrowTrendUp, label: "Trend Arrow (Advisory)" },
  { name: "faBriefcase", icon: faBriefcase, label: "Briefcase (Asset Management)" },
  { name: "faBuildingColumns", icon: faBuildingColumns, label: "Bank/Institution (Fixed Income)" },
  { name: "faShieldHalved", icon: faShieldHalved, label: "Shield / Security (Integrity First)" },
  { name: "faChartLine", icon: faChartLine, label: "Line Chart (Research)" },
  { name: "faUserCheck", icon: faUserCheck, label: "User Verified (Guidance)" },
  { name: "faScaleUnbalancedFlip", icon: faScaleUnbalancedFlip, label: "Compliance Scales" },
  { name: "faCoins", icon: faCoins, label: "Coins / Wealth" },
  { name: "faHandHoldingDollar", icon: faHandHoldingDollar, label: "Hand holding Dollar" },
  { name: "faPercent", icon: faPercent, label: "Percentage / Interest" },
  { name: "faPiggyBank", icon: faPiggyBank, label: "Piggy Bank" },
  { name: "faVault", icon: faVault, label: "Vault / Savings" },
  { name: "faGlobe", icon: faGlobe, label: "Globe / International" },
  { name: "faLaptopCode", icon: faLaptopCode, label: "Laptop Tech" },
  { name: "faGraduationCap", icon: faGraduationCap, label: "Graduation (Education)" },
  { name: "faClock", icon: faClock, label: "Clock / Time" },
  { name: "faPhone", icon: faPhone, label: "Phone" },
  { name: "faEnvelope", icon: faEnvelope, label: "Envelope" },
  { name: "faMapLocationDot", icon: faMapLocationDot, label: "Map / Directions" },
  { name: "faUsers", icon: faUsers, label: "Users / Clients" },
];

interface IconSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
}

export default function IconSelectorModal({ isOpen, onClose, onSelect }: IconSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
      <div className="bg-white w-full max-w-[650px] rounded-[12px] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fafafa]">
          <div>
            <h3 className="font-bold text-gray-800 text-[1.1rem]">Select Icon</h3>
            <p className="text-gray-500 text-xs mt-0.5">Choose an icon to display for this feature or card</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full">
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>

        {/* Grid area */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ICON_LIBRARY.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => onSelect(item.name)}
                className="group border border-gray-200 rounded-[10px] p-4 flex flex-col items-center justify-center text-center gap-2.5 transition-all bg-white hover:border-[#E8740C] hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="w-[50px] h-[50px] bg-gray-50 text-gray-500 rounded-full flex items-center justify-center text-lg group-hover:bg-[#FFF3EB] group-hover:text-[#E8740C] transition-all">
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 text-[11px] leading-tight">{item.label}</span>
                  <span className="font-mono text-gray-400 text-[9px] mt-0.5 truncate max-w-[110px]" title={item.name}>{item.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-[#fafafa] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-200 text-gray-600 rounded-[8px] px-4 py-2 text-xs font-semibold hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
