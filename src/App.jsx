import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import SubStoreStaff from "./pages/SubStoreStaff";
import SubStoreManager from "./pages/SubStoreManager";
import MainStore from "./pages/MainStore";
import MainStoreApprover from "./pages/MainStoreApprover";
import HeadOffice from "./pages/HeadOffice";
import PettyCash from "./pages/PettyCash";
import ProtectedRoute from "./components/ProtectedRoute";
import Admin from "./pages/Admin";
import Unauthorized from "./pages/Unauthorized";
import { ContextProvider } from "./context/authContext";
import AddUserTab from "./components/Admin/Users/AddUserTab";
import AllUsersTab from "./components/Admin/Users/AllUsersTab";
import AllStoresTab from "./components/Admin/Stores/AllStoresTab";
import AddStoreTab from "./components/Admin/Stores/AddStoreTab";
import NotFound from "./pages/NotFound";
import EditUser from "./components/Admin/Users/EditUser";
import EditStore from "./components/Admin/Stores/EditStore";
import AddItemsAndCategories from "./components/Admin/ItemsAndCategories/AddItemsAndCategories";
import { ToastProvider } from "./context/ToastContext";
import EditItems from "./components/Admin/ItemsAndCategories/EditItems";

export default function App() {
  return (
    <BrowserRouter>
      <ContextProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-6">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Sub Store User — creates requests */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["sub-store", "super admin"]} />
                  }
                >
                  <Route path="/substore-staff" element={<SubStoreStaff />} />
                </Route>

                {/* Sub Store Manager — 1st level approval */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["sub-store-manager", "super admin"]}
                    />
                  }
                >
                  <Route path="/substore-manager" element={<SubStoreManager />} />
                </Route>

                {/* Main Store Staff — fulfills approved requests */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["main-store", "super admin"]}
                    />
                  }
                >
                  <Route path="/mainstore" element={<MainStore />} />
                </Route>

                {/* Main Store Manager — final approval of sub-store requests + approves HO requests */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["main-store-manager", "super admin"]}
                    />
                  }
                >
                  <Route
                    path="/mainstore-manager"
                    element={<MainStoreApprover />}
                  />
                </Route>

                {/* Head Office — creates HO requests, fulfills HO approved requests */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["headoffice", "super admin"]}
                    />
                  }
                >
                  <Route path="/headoffice" element={<HeadOffice />} />
                </Route>

                {/* Petty Cash — creates PC requests, fulfills PC approved requests */}

                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["pettycash", "super admin"]}
                    />
                  }
                >
                  <Route path="/pettycash" element={<PettyCash />} />
                </Route>

                {/* Admin — create users and sub stores */}

                <Route
                  element={
                    <ProtectedRoute allowedRoles={["admin", "super admin"]} />
                  }
                >
                  <Route path="/admin" element={<Admin />}>
                    <Route path="user" element={<AddUserTab />} />
                    <Route path="user/:id" element={<EditUser />} />
                    <Route path="store" element={<AddStoreTab />} />
                    <Route path="store/:id" element={<EditStore />} />
                    <Route path="all-users" element={<AllUsersTab />} />
                    <Route path="all-stores" element={<AllStoresTab />} />
                    <Route path="items-and-categories" element={<AddItemsAndCategories />} />
                    <Route path="item/:id" element={<EditItems/>}/>
                  </Route>
                </Route>

                {/* Default redirect */}
                {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </ToastProvider>
      </ContextProvider>
    </BrowserRouter>
  );
}
