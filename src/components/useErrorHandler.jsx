import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/authContext"

const useErrorHandler = () => {
    const navigate = useNavigate()
    const { setAuth } = useAuth()

    const handleError = (error, customMessage) => {
        const errorMsg = error.response?.data?.message || "Server Error";
        const status = error.response?.status;

        const isSessionError =
            errorMsg.includes("Session") ||
            errorMsg.includes("Invalid") ||
            errorMsg.includes("expired");

        if (
            (status === 401 && isSessionError) ||
            (status === 400 && isSessionError)
        ) {
            setAuth({
                accessToken: null,
                username: null,
                role: null,
                storeName: null,
                store_id: null,
                message: errorMsg,
            });

            navigate("/login");
            return errorMsg;
        }

        if (
            (status === 403 || status === 400) &&
            (
                errorMsg.includes("inactive") ||
                errorMsg.includes("غیر فعال")
            )
        ) {
            setAuth((prev) => ({
                ...prev,
                isBlocked: true,
                message: errorMsg,
            }));

            return errorMsg;
        }

        console.error(customMessage, error);
        return errorMsg || customMessage;
    };
    return handleError
}

export default useErrorHandler