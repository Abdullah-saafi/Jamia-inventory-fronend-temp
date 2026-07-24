import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import { useAuth } from "../context/authContext";
import moment from "moment-hijri";
import { useState } from "react";
import baitussalam from "../assets/baitussalam.svg";
import logouticon from "../assets/logouticon.svg";

const links = [
  { to: "/substore-staff", label: "اسٹور", roles: ["sub-store"] },
  {
    to: "/substore-manager",
    label: "اسٹور نگران",
    roles: ["sub-store-manager"],
  },
  { to: "/mainstore", label: "مرکزی اسٹور", roles: ["main-store"] },
  {
    to: "/mainstore-manager",
    label: "مرکزی اسٹور نگران",
    roles: ["main-store-manager"],
  },
  { to: "/headoffice", label: "مرکزی دفتر", roles: ["headoffice"] },
  { to: "/pettycash", label: "پٹی کیش", roles: ["pettycash"] },
  { to: "/admin", label: "انتظامی دفتر", roles: ["admin"] },
];

export default function Navbar() {
  const [date, setDate] = useState(new Date());
  const [logoutLoading, setLogoutLoading] = useState(false);
  const hijriDate = moment(date).format("iYYYY/iD/iMMMM");

  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();

  const logoutUser = async () => {
    try {
      setLogoutLoading(true);
      const response = await logout();
      setAuth({
        accessToken: null,
        username: null,
        role: null,
        storeName: null,
        store_id: null,
        message: null,
        isBlocked: false,
      });
      navigate("/login");
    } catch (error) {
      setAuth({
        accessToken: null,
        username: null,
        role: null,
        storeName: null,
        store_id: null,
        message: null,
        isBlocked: false,
      });
      navigate("/login");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#2a7379c2] border-b border-emerald-500 shadow-lg">
      <div className="px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-4 min-w-fit">

          <div className="w-15 h-15 flex items-center justify-center bg-transparent border-0 shadow-none">
            <img
              src={baitussalam}
              alt="Baitussalam"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col">
            <h1 className="text-white font-bold text-lg tracking-wide leading-none">
              Jamia Baitussalam
            </h1>
            <span className="text-emerald-100 text-[11px] font-bold tracking-wider uppercase">
              جامعہ بیت السلام
            </span>
            <span className="text-emerald-100 text-[11px] tracking-wider uppercase">
              Inventory Management System
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="hidden xl:flex items-center gap-1">

          {auth.accessToken &&
            links
              .filter(
                (link) =>
                  auth.role === "super admin" ||
                  link.roles.includes(auth.role)
              )
              .map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `
                      relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                      ${isActive
                      ? "text-white bg-black/20"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                    }
                    `
                  }
                >
                  {label}
                </NavLink>
              ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Date */}
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[11px] text-emerald-100">
              {date.toLocaleDateString("en-PK", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>

            <span className="text-[11px] text-white font-medium">
              {hijriDate}
            </span>
          </div>

          {/* Divider */}
          <div className="hidden lg:block h-8 w-px bg-white/20" />

          {/* User */}
          {(auth.role && auth.username) && (
            <div className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-xl">

              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white text-emerald-700 flex items-center justify-center font-bold">
                  {auth.username?.charAt(0)?.toUpperCase()}
                </div>


                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-emerald-700" />
              </div>

              <div className="hidden md:flex flex-col">
                <span className="text-white text-sm font-semibold">
                  {auth.username}
                </span>

                <span className="text-emerald-100 text-[10px] uppercase">
                  {auth.role.replaceAll("-", " ").toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Logout */}
          {auth.accessToken && (
            <button
              onClick={logoutUser}
              disabled={logoutLoading}
              className="
            bg-red-500/80
            hover:bg-red-600
            text-white
            text-sm
            font-semibold
            px-4
            py-2
            rounded-xl
            transition-all
            disabled:opacity-50
          "
            >
              {logoutLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <span>Logout</span>
                  <img
                    src={logouticon}
                    alt="logout"
                    className="w-4 h-4"
                  />
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
