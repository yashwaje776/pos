import React, { useState } from "react";
import { FaHome } from "react-icons/fa";
import { MdOutlineReorder, MdTableBar } from "react-icons/md";
import { CiCircleMore } from "react-icons/ci";
import { BiSolidDish } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [guestCount, setGuestCount] = useState(0);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const increment = () => {
        if (guestCount >= 6) return;
        setGuestCount((prev) => prev + 1);
    };

    const decrement = () => {
        if (guestCount <= 0) return;
        setGuestCount((prev) => prev - 1);
    };

    const isActive = (path) => location.pathname === path;

    const handleCreateOrder = () => {
        navigate("/tables");
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-2 h-16 flex justify-around ">

            <button
                onClick={() => navigate("/")}
                className={`flex items-center justify-center font-bold ${
                    isActive("/") 
                        ? "text-black bg-gray-200" 
                        : "text-gray-500"
                } w-[300px] rounded-[20px]`}
            >
                <FaHome className="inline mr-2" size={20} />
                <p>Home</p>
            </button>

            <button
                onClick={() => navigate("/orders")}
                className={`flex items-center justify-center font-bold ${
                    isActive("/orders") 
                        ? "text-black bg-gray-200" 
                        : "text-gray-500"
                } w-[300px] rounded-[20px]`}
            >
                <MdOutlineReorder className="inline mr-2" size={20} />
                <p>Orders</p>
            </button>

            <button
                onClick={() => navigate("/tables")}
                className={`flex items-center justify-center font-bold ${
                    isActive("/tables") 
                        ? "text-black bg-gray-200" 
                        : "text-gray-500"
                } w-[300px] rounded-[20px]`}
            >
                <MdTableBar className="inline mr-2" size={20} />
                <p>Tables</p>
            </button>

            <button className="flex items-center justify-center font-bold text-gray-500 w-[300px]">
                <CiCircleMore className="inline mr-2" size={20} />
                <p>More</p>
            </button>

            <button
                disabled={isActive("/tables") || isActive("/menu")}
                onClick={openModal}
                className="absolute bottom-6 bg-yellow-500 text-white rounded-full p-4 shadow-lg"
            >
                <BiSolidDish size={40} />
            </button>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="Create Order">
                
                <div>
                    <label className="block text-gray-500 mb-2 text-sm font-medium">
                        Customer Name
                    </label>
                    <div className="flex items-center rounded-lg p-3 px-4 bg-gray-100">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            type="text"
                            placeholder="Enter customer name"
                            className="bg-transparent flex-1 text-black focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-500 mb-2 mt-3 text-sm font-medium">
                        Customer Phone
                    </label>
                    <div className="flex items-center rounded-lg p-3 px-4 bg-gray-100">
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            type="number"
                            placeholder="+91-9999999999"
                            className="bg-transparent flex-1 text-black focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block mb-2 mt-3 text-sm font-medium text-gray-500">
                        Guest
                    </label>
                    <div className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-lg">
                        <button onClick={decrement} className="text-yellow-500 text-2xl">
                            &minus;
                        </button>
                        <span className="text-black">
                            {guestCount} Person
                        </span>
                        <button onClick={increment} className="text-yellow-500 text-2xl">
                            &#43;
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleCreateOrder}
                    className="w-full bg-yellow-500 text-white rounded-lg py-3 mt-8 hover:bg-yellow-600 transition"
                >
                    Create Order
                </button>

            </Modal>
        </div>
    );
};

export default BottomNav;