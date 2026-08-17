import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";


import DashboardSelectPage from "./pages/DashboardSelectPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DonorDashboard from "./pages/DonorDashboard";
import IndividualDonorDashboard from "./pages/IndividualDonorDashboard";
import InventoryPage from "./pages/InventoryPage";
import BarcodeScannerPage from "./pages/BarcodeScannerPage";
import NgoDashboard from "./pages/NgoDashboard";
import AvailableDonationsPage from "./pages/AvailableDonationsPage";
import NgoClaimsPage from "./pages/NgoClaimsPage";
import DonationsPage from "./pages/DonationsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDetailsPage from "./pages/Admindetailspage";
import AdminApprovalsPage from "./pages/AdminApprovalsPage";
import DeliveryPartnerDashboard from "./pages/DeliveryPartnerDashboard";
import DeliveryBoyDashboard from "./pages/DeliveryBoyDashboard";
import DeliveryTrackingPage from "./pages/DeliveryTrackingPage";
import SalesPage from "./pages/SalesPage";

export default function App() {
  return (
    <BrowserRouter>

      <Routes>


        {/* ROOT & LOGIN */}

        <Route
          path="/"
          element={
            <LoginPage />
          }
        />

        <Route
          path="/select"
          element={
            <DashboardSelectPage />
          }
        />


        {/* AUTH */}

        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />


        <Route
          path="/register"
          element={
            <RegisterPage />
          }
        />


        {/* DONOR */}

        <Route
          path="/donor"
          element={
            <DonorDashboard />
          }
        />

        <Route
          path="/individual"
          element={
            <IndividualDonorDashboard />
          }
        />

        <Route
          path="/inventory"
          element={
            <InventoryPage />
          }
        />

        <Route
          path="/donor/inventory"
          element={
            <InventoryPage />
          }
        />

        <Route
          path="/donations"
          element={
            <DonationsPage />
          }
        />

        <Route
          path="/donor/donations"
          element={
            <DonationsPage />
          }
        />

        <Route
          path="/donor/barcode"
          element={
            <BarcodeScannerPage />
          }
        />

        <Route
          path="/sales"
          element={
            <SalesPage />
          }
        />

        <Route
          path="/donor/sales"
          element={
            <SalesPage />
          }
        />


        {/* NGO */}

        <Route
          path="/ngo"
          element={
            <NgoDashboard />
          }
        />

        <Route
          path="/ngo/available"
          element={
            <AvailableDonationsPage />
          }
        />

        <Route
          path="/ngo/claims"
          element={
            <NgoClaimsPage />
          }
        />


        {/* ADMIN */}

        <Route
          path="/admin"
          element={
            <AdminDashboard />
          }
        />


        <Route
          path="/admin/details/:section"
          element={
            <AdminDetailsPage />
          }
        />

        <Route
          path="/admin/approvals"
          element={
            <AdminApprovalsPage />
          }
        />


        {/* DELIVERY */}

        <Route
          path="/delivery/partner"
          element={
            <DeliveryPartnerDashboard />
          }
        />

        <Route
          path="/delivery/boy"
          element={
            <DeliveryBoyDashboard />
          }
        />

        <Route
          path="/donations/:id/track"
          element={
            <DeliveryTrackingPage />
          }
        />


        {/* FALLBACK */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


      </Routes>

    </BrowserRouter>
  );
}