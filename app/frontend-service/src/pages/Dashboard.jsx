import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const { user, setUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="bg-white p-6 rounded shadow-md">

                <h1 className="text-3xl font-bold">Dashboard</h1>

                <p className="mt-4 text-lg">Welcome, {user?.email} 👋</p>

                <button
                    onClick={handleLogout}
                    className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
