import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Calendar,
  BarChart3,
  Megaphone,
  Clock,
  Settings,
  Users,
  Mail,
  Key
} from "lucide-react";
import logoPath from "@assets/shady5_no_bg_cropped_strict_1751121425277.png";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    name: "Account Setup",
    href: "/accounts",
    icon: Key,
  },
  {
    name: "Activity Log",
    href: "/activity",
    icon: Clock,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-0 w-64 bg-white shadow-lg border-r border-gray-200 h-screen flex-shrink-0 z-10">
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img src={logoPath} alt="Shady 5.0" className="w-10 h-10" />
          <div>
            <h1 className="font-bold text-xl text-gray-900">Shady 5.0</h1>
            <p className="text-sm text-gray-500">Calendar Automation</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href} asChild>
              <a
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                  isActive
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
