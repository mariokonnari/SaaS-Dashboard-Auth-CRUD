export default function Navbar() {
    return (
        <div className="w-full bg-white shadow h-16 flex items-center justify-end px-6">
            <button
                onClick={() => {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                }}
                className="px-4 py-2 bg-red-500 text-white rounded"
            >
                Logout
            </button>
        </div>
    );
}