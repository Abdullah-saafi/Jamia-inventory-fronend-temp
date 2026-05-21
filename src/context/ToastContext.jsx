import { createContext, useContext, useState } from "react";
import ToastContainer from "../components/ToastContainer";

const ToastContext = createContext()

export const ToastProvider = ({children}) => {
    const [toasts, showToasts] = useState([])

    const showToast = (message, type) => {
        const id = Date.now() + Math.random()

        const newToast = {id, message, type}

        showToasts((prev) => [newToast, ...prev].slice(0,3))

        setTimeout(() => {
            removeToast(id)
        },3000)
    }

    const removeToast = (id) => {
        showToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{showToast}}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast}/>
        </ToastContext.Provider>
    )
}

export const useToast = () => useContext(ToastContext)