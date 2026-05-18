import { createContext, useContext, useState } from "react";
import ToastContainer from "../components/ToastContainer";

const ToastContext = createContext()

export const ToastProvider = ({children}) => {
    const [toasts, setToasts] = useState([])

    const showToast = (message, type) => {
        const id = Date.now()

        const newToast = {id, message, type}

        setToasts((prev) => [newToast, ...prev].slice(0,3))

        setTimeout(() => {
            removeToast(id)
        },3000)
    }

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{showToast}}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast}/>
        </ToastContext.Provider>
    )
}

export const useToast = () => useContext(ToastContext)