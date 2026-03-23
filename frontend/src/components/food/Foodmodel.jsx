import React, { useState, useEffect } from "react";
import Modal from "../shared/Modal";
import { addMenuItem, updateMenuItem } from "../../https";

export default function FoodModal({
    isOpen,
    onClose,
    categories,
    activeCategory,
    editingFood,
    refreshFoods
}) {
    const [foodForm, setFoodForm] = useState({
        name: "",
        categoryId: "",
        isVeg: true,
        variants: [{ name: "", price: "" }],
        image: null
    });

    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* ---------------- INIT ---------------- */

    useEffect(() => {
        if (editingFood) {
            setFoodForm({
                name: editingFood.name,
                categoryId: editingFood.categoryId?._id || "",
                isVeg: editingFood.isVeg ?? true,
                variants: editingFood.variants?.length
                    ? editingFood.variants
                    : [{ name: "", price: "" }],
                image: null
            });

            setPreview(editingFood.image?.url || null);
        } else {
            resetForm();
        }
    }, [editingFood, isOpen]);

    const resetForm = () => {
        setFoodForm({
            name: "",
            categoryId: activeCategory || "",
            isVeg: true,
            variants: [{ name: "", price: "" }],
            image: null
        });
        setPreview(null);
    };

    /* ---------------- IMAGE HANDLER ---------------- */

    const handleImageChange = (file) => {
        if (!file) return;

        setFoodForm((prev) => ({ ...prev, image: file }));
        setPreview(URL.createObjectURL(file));
    };

    /* ---------------- VARIANTS ---------------- */

    const addVariant = () => {
        setFoodForm((prev) => ({
            ...prev,
            variants: [...prev.variants, { name: "", price: "" }]
        }));
    };

    const removeVariant = (index) => {
        const updated = [...foodForm.variants];
        updated.splice(index, 1);

        setFoodForm({
            ...foodForm,
            variants: updated.length ? updated : [{ name: "", price: "" }]
        });
    };

    const handleVariantChange = (index, field, value) => {
        const updated = [...foodForm.variants];
        updated[index][field] = value;

        setFoodForm({ ...foodForm, variants: updated });
    };

    /* ---------------- SUBMIT ---------------- */

    const handleSubmit = async () => {
        const hasValidVariant = foodForm.variants.some(
            (v) => v.name && v.price
        );

        const isImageRequired = !editingFood && !foodForm.image;

        if (
            !foodForm.name ||
            !foodForm.categoryId ||
            !hasValidVariant ||
            isImageRequired ||
            isSubmitting
        ) return;

        try {
            setIsSubmitting(true);

            const formData = new FormData();
            formData.append("name", foodForm.name);
            formData.append("categoryId", foodForm.categoryId);
            formData.append("isVeg", foodForm.isVeg);

            formData.append(
                "variants",
                JSON.stringify(
                    foodForm.variants.filter(v => v.name && v.price)
                )
            );

            if (foodForm.image) {
                formData.append("image", foodForm.image);
            }

            if (editingFood) {
                await updateMenuItem(editingFood._id, formData);
            } else {
                await addMenuItem(formData);
            }

            onClose();
            resetForm();
            refreshFoods();

        } finally {
            setIsSubmitting(false);
        }
    };

    /* ---------------- UI ---------------- */

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                resetForm();
            }}
            title={editingFood ? "Edit Dish" : "Add Dish"}
        >
            <div className="space-y-6 bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl">

                {/* NAME */}
                <input
                    placeholder="Dish name"
                    value={foodForm.name}
                    onChange={(e) =>
                        setFoodForm({ ...foodForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />

                {/* VARIANTS */}
                <div className="space-y-3">
                    {foodForm.variants.map((v, i) => (
                        <div key={i} className="flex gap-2 items-center bg-white/10 p-2 rounded-xl border border-white/10">
                            <input
                                placeholder="Variant"
                                value={v.name}
                                onChange={(e) =>
                                    handleVariantChange(i, "name", e.target.value)
                                }
                                className="w-1/2 px-3 py-2 bg-transparent text-white border border-white/20 rounded-lg"
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                value={v.price}
                                onChange={(e) =>
                                    handleVariantChange(i, "price", e.target.value)
                                }
                                className="w-1/2 px-3 py-2 bg-transparent text-white border border-white/20 rounded-lg"
                            />
                            <button
                                onClick={() => removeVariant(i)}
                                className="text-red-400 px-2"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addVariant}
                        className="text-orange-400 text-sm"
                    >
                        + Add Variant
                    </button>
                </div>

                {/* CATEGORY */}
                <select
                    value={foodForm.categoryId}
                    onChange={(e) =>
                        setFoodForm({ ...foodForm, categoryId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/20 text-white border border-white/20 rounded-xl"
                >
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id} className="text-black">
                            {cat.name}
                        </option>
                    ))}
                </select>

                {/* VEG/NON-VEG */}
                <select
                    value={foodForm.isVeg}
                    onChange={(e) =>
                        setFoodForm({
                            ...foodForm,
                            isVeg: e.target.value === "true"
                        })
                    }
                    className="w-full px-4 py-3 bg-white/20 text-white border border-white/20 rounded-xl"
                >
                    <option value="true" className="text-black">Veg</option>
                    <option value="false" className="text-black">Non Veg</option>
                </select>

                {/* IMAGE UPLOAD */}
                <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:border-orange-400 transition overflow-hidden">

                    {/* IF IMAGE EXISTS */}
                    {preview ? (
                        <>
                            <img
                                src={preview}
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-sm transition">
                                Change Image
                            </div>
                        </>
                    ) : (
                        /* IF NO IMAGE */
                        <span className="text-gray-300 text-sm">
                            Click to upload image
                        </span>
                    )}

                    {/* SINGLE INPUT */}
                    <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleImageChange(e.target.files[0])}
                    />
                </label>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white/20 text-white"
                    >
                        Cancel
                    </button>

                    <button
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="px-5 py-2 rounded-lg bg-orange-500 text-white disabled:opacity-50"
                    >
                        {isSubmitting
                            ? "Saving..."
                            : editingFood
                                ? "Update"
                                : "Add"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}