import { Outlet } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminLayoutPage = () => {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminLayoutPage;
