import React from 'react';
import { motion } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25 }}
                className="bg-[#111111]/80 backdrop-blur-xl no-scrollbar border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white tracking-wide">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white text-xl transition"
                    >
                        &times;
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 text-white ">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

export default Modal;