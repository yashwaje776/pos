import React, { useState, useEffect, useMemo } from "react";
import { Trash2, Edit, Plus } from "lucide-react";
import { MdCategory } from "react-icons/md";

import {
    getCategories,
    updateCategory,
    deleteCategory as apiDeleteCategory,
    getMenuItems,
    updateMenuItem,
    deleteMenuItem
} from "../https";

import { useSelector } from "react-redux";
import FoodModal from "../components/food/Foodmodel";
import CategoryModal from "../components/food/CategoryModal";

/* ---------------- BUTTONS ---------------- */

const PrimaryButton = ({ children, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
        bg-gradient-to-r from-yellow-500 to-orange-500
        hover:from-yellow-400 hover:to-orange-400
        transition-all shadow-lg hover:shadow-yellow-500/30"
    >
        {children}
    </button>
);

const GhostButton = ({ children, onClick }) => (
    <button
        onClick={onClick}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
    >
        {children}
    </button>
);

/* ---------------- TOGGLE ---------------- */

const ToggleSwitch = ({ enabled, onChange }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onChange();
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300
        ${enabled
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-500/40"
                : "bg-gray-600"
            }`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300
            ${enabled ? "translate-x-6" : "translate-x-1"}`}
        />
    </button>
);

/* ---------------- MAIN ---------------- */

export default function MenuDetail() {
    const [categories, setCategories] = useState([]);
    const [foods, setFoods] = useState([]);
    const { user } = useSelector((state) => state.user);

    const [activeCategory, setActiveCategory] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [editingFood, setEditingFood] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

    const [togglingFoodId, setTogglingFoodId] = useState(null);
    const [togglingCategoryId, setTogglingCategoryId] = useState(null);

    /* ---------------- FETCH ---------------- */

    useEffect(() => {
        fetchCategories();
        fetchFoods();
    }, []);

    const fetchCategories = async () => {
        const res = await getCategories();
        const data = res.data.data.map((c) => ({
            ...c,
            enabled: c.enabled ?? true
        }));
        setCategories(data);
        if (!activeCategory && data.length) setActiveCategory(data[0]._id);
    };

    const fetchFoods = async () => {
        const res = await getMenuItems();
        const data = res.data.data.map((f) => ({
            ...f,
            enabled: f.enabled ?? true
        }));
        setFoods(data);
    };

    /* ---------------- FILTER ---------------- */

    const filteredFoods = useMemo(
        () => foods.filter((f) => f.categoryId?._id === activeCategory),
        [foods, activeCategory]
    );

    /* ---------------- CATEGORY ACTIONS ---------------- */

    const toggleCategory = async (id) => {
        if (togglingCategoryId === id) return;

        setTogglingCategoryId(id);

        const cat = categories.find(c => c._id === id);
        const newValue = !cat.enabled;

        setCategories(prev =>
            prev.map(c => c._id === id ? { ...c, enabled: newValue } : c)
        );

        try {
            await updateCategory(id, { enabled: newValue });
        } catch (err) {
            console.error("Category toggle failed:", err);
            // rollback
            setCategories(prev =>
                prev.map(c => c._id === id ? { ...c, enabled: !newValue } : c)
            );
        }

        setTogglingCategoryId(null);
    };

    const deleteCategory = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this category?");
        if (!confirmDelete) return;
        await apiDeleteCategory(id);
        fetchCategories();
    };

    /* ---------------- FOOD ACTIONS ---------------- */

    const deleteFood = async (id) => {
        if (!window.confirm("Are you sure you want to delete this dish?")) return;

        try {
            await deleteMenuItem(id);
            fetchFoods();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const toggleFood = async (id) => {
        if (togglingFoodId === id) return;

        setTogglingFoodId(id);

        const item = foods.find(f => f._id === id);
        const newValue = !item.enabled;

        setFoods(prev =>
            prev.map(f => f._id === id ? { ...f, enabled: newValue } : f)
        );

        try {
            await updateMenuItem(id, { enabled: newValue });
        } catch (err) {
            console.error("Food toggle failed:", err);
            // rollback
            setFoods(prev =>
                prev.map(f => f._id === id ? { ...f, enabled: !newValue } : f)
            );
        }

        setTogglingFoodId(null);
    };

    /* ---------------- UI ---------------- */

    return (
        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 no-scrollbar">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Menu Management</h1>
                    <p className="text-gray-400">Manage restaurant menu</p>
                </div>

                <div className="flex gap-3">
                    <PrimaryButton onClick={() => {
                        setEditingCategory(null);
                        setShowCategoryModal(true);
                    }}>
                        <MdCategory /> Category
                    </PrimaryButton>

                    <PrimaryButton onClick={() => {
                        setEditingFood(null);
                        setShowFoodModal(true);
                    }}>
                        <Plus size={16} /> Dish
                    </PrimaryButton>
                </div>
            </div>

            {/* CATEGORY LIST */}
            <div>
                <p className="mb-2 font-medium text-sm text-gray-300">Category</p>

                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat._id;
                        const isDisabled = !cat.enabled;

                        return (
                            <div
                                key={cat._id}
                                onClick={() => {
                                    if (!cat.enabled) return; // prevent selecting disabled
                                    setActiveCategory(cat._id);
                                }}
                                className={`
                                    min-w-[180px] cursor-pointer rounded-xl border p-4
                                    bg-white/5 hover:bg-white/10 transition-all duration-200
                                    ${isActive ? "border-yellow-400 shadow-md" : "border-transparent"}
                                    ${isDisabled ? "opacity-40" : ""}
                                `}
                            >
                                {cat.image?.url && (
                                    <img
                                        src={cat.image.url}
                                        alt={cat.name}
                                        className="h-24 w-full object-cover rounded-lg mb-3"
                                    />
                                )}

                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-sm truncate">
                                        {cat.name}
                                    </h3>

                                    <ToggleSwitch
                                        enabled={!!cat.enabled}
                                        onChange={() => toggleCategory(cat._id)}
                                    />
                                </div>

                                <div className="mt-3 flex flex-col gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingCategory(cat);
                                            setShowCategoryModal(true);
                                        }}
                                        className="text-yellow-400 text-xs hover:underline text-left"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteCategory(cat._id);
                                        }}
                                        className="text-red-400 text-xs hover:underline text-left"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            {/* FOOD GRID */}
            <div>
                <p className="mb-3 text-sm font-medium text-gray-300">Food Items</p>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filteredFoods.map((item) => {
                        const isVeg = item.isVeg;
                        const isEnabled = !!item.enabled;

                        const handleEdit = () => {
                            setEditingFood(item);
                            setShowFoodModal(true);
                        };

                        return (
                            <div
                                key={item._id}
                                className={`
            group rounded-2xl overflow-hidden border bg-white/5
            border-white/10 hover:border-yellow-400/40
            hover:shadow-lg hover:shadow-black/20
            transition-all duration-200
            ${!isEnabled ? "opacity-50" : ""}
          `}
                            >
                                <div className="relative">
                                    {item.image?.url ? (
                                        <img
                                            src={item.image.url}
                                            alt={item.name}
                                            className="h-40 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
                                            No Image
                                        </div>
                                    )}

                                    <span className={`
                absolute top-2 left-2 text-xs px-2 py-1 rounded-full backdrop-blur
                ${isVeg ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
              `}>
                                        {isVeg ? "Veg" : "Non-Veg"}
                                    </span>
                                </div>

                                <div className="p-4 flex flex-col gap-3">
                                    <h3 className="font-semibold text-sm truncate">
                                        {item.name}
                                    </h3>

                                    <div className="text-xs text-gray-400 space-y-1">
                                        {item.variants?.slice(0, 2).map((v, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span>{v.name}</span>
                                                <span>₹{v.price}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <GhostButton onClick={handleEdit}>
                                                <Edit size={16} />
                                            </GhostButton>

                                            <GhostButton onClick={() => deleteFood(item._id)}>
                                                <Trash2 size={16} />
                                            </GhostButton>
                                        </div>

                                        <ToggleSwitch
                                            enabled={isEnabled}
                                            onChange={() => toggleFood(item._id)}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                }}
                refreshCategories={fetchCategories}
                editingCategory={editingCategory}
            />

            <FoodModal
                isOpen={showFoodModal}
                onClose={() => {
                    setShowFoodModal(false);
                    setEditingFood(null);
                }}
                categories={categories}
                activeCategory={activeCategory}
                editingFood={editingFood}
                refreshFoods={fetchFoods}
            />
        </div>
    );
}