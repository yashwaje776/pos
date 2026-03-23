import React, { useState, useEffect } from "react";
import Modal from "../shared/Modal";
import { addCategory, updateCategory } from "../../https";

export default function CategoryModal({
    isOpen,
    onClose,
    refreshCategories,
    editingCategory
}) {
    const [name, setName] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* ---------------- PREFILL WHEN EDIT ---------------- */
    useEffect(() => {
        if (editingCategory) {
            setName(editingCategory.name);
            setPreview(editingCategory.image?.url || null);
        } else {
            resetForm();
        }
    }, [editingCategory]);

    /* ---------------- RESET ---------------- */
    const resetForm = () => {
        setName("");
        setImage(null);
        setPreview(null);
    };

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = async () => {
        if (!name.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);

            const formData = new FormData();
            formData.append("name", name);

            if (image) {
                formData.append("image", image);
            }

            if (editingCategory) {
                await updateCategory(editingCategory._id, formData);
            } else {
                await addCategory(formData);
            }

            resetForm();
            onClose();
            refreshCategories();

        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                resetForm();
            }}
            title={editingCategory ? "Edit Category" : "Add Category"}
        >
            <div className="space-y-6 bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl text-white">

                {/* NAME */}
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Category name..."
                    className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />

                {/* IMAGE UPLOAD */}
                <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:border-orange-400 transition overflow-hidden">

                    {/* PREVIEW */}
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
                        <span className="text-gray-300 text-sm">
                            Click to upload image
                        </span>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            setImage(file);
                            setPreview(URL.createObjectURL(file));
                        }}
                    />
                </label>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={() => {
                            onClose();
                            resetForm();
                        }}
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
                            : editingCategory
                                ? "Update"
                                : "Add"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}