import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  Boxes,
  HandHeart,
  LayoutDashboard,
  Leaf,
  LogOut,
  PackageSearch,
  Truck,
  ClipboardList,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const menus = {
  DONOR: [
    {
      name: "Dashboard",
      path: "/donor",
      icon: LayoutDashboard,
      end: true,
    },
    {
      name: "Inventory",
      path: "/donor/inventory",
      icon: Boxes,
    },
    {
      name: "Donations",
      path: "/donor/donations",
      icon: HandHeart,
    },
  ],

  NGO: [
    {
      name: "Dashboard",
      path: "/ngo",
      icon: LayoutDashboard,
      end: true,
    },
    {
      name: "Available Food",
      path: "/ngo/available",
      icon: PackageSearch,
    },
    {
      name: "My Claims",
      path: "/ngo/claims",
      icon: HandHeart,
    },
  ],

  DELIVERY_PARTNER: [
    {
      name: "Operations Desk",
      path: "/delivery/partner",
      icon: LayoutDashboard,
      end: true,
    },
  ],

  DELIVERY_BOY: [
    {
      name: "Operations Desk",
      path: "/delivery/boy",
      icon: LayoutDashboard,
      end: true,
    },
  ],

  ADMIN: [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
      end: true,
    },
  ],
};

export default function DashboardLayout({
  title,
  subtitle,
  children,
}) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#f7faf7] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white">
              <Leaf size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold">Aura Food</h1>

              <p className="text-xs text-slate-500">
                Smart Food Management
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {(menus[user?.role] || []).map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                      isActive
                        ? "bg-green-50 text-green-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`
                  }
                >
                  <Icon size={19} />

                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 rounded-2xl bg-slate-50 p-4">
              <p className="font-bold">
                {user?.full_name || "Aura Food User"}
              </p>

              <p className="mt-1 text-xs font-semibold text-green-600">
                {user?.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="border-b border-slate-200 bg-white px-6 py-5">
          <h2 className="text-2xl font-bold">{title}</h2>

          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        </header>

        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}