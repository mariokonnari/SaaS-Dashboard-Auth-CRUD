import { Link } from "react-router-dom";

export default function Sidebar() {
    return (
        <div className="w-64 bg-gray-800 text-white h-screen p-5 space-y-6 fixed">
            <h1 className="text-x1 font-bold">Admin Dashboard</h1>

            <nav className="flex flex-col space-y-3">
                <Link className="hover:text-gray-300" to="/dashboard/products">Products</Link>
                <Link className="hover:text-gray-300" to="/dashboard/invoices">Invoices</Link>
                <Link className="hover:text-gray-300" to="/dashboard/users">Users</Link>
            </nav>
        </div>
    );
}