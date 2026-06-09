import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function NotFound() {
  const { auth } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-6xl font-black text-gray-200">404</h1>
      <p className="text-xl text-gray-600 mt-4">
        Oops! This page doesn't exist.
      </p>
    </div>
  );
}
