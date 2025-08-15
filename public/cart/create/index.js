window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");
    const cartProductId = localStorage.getItem("cartProductId");
    const memberId = localStorage.getItem("memberId");

    // Fill the productId input automatically
    const productIdInput = document.querySelector("input[name='productId']");
    productIdInput.value = cartProductId;

    const form = document.querySelector("form");
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const quantityInput = document.querySelector("input[name='quantity']");
        const quantity = parseInt(quantityInput.value);

        if (!quantity || quantity <= 0) {
            alert("Enter a valid quantity");
            return;
        }

        try {
            const res = await fetch("/carts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    memberId : parseInt(memberId),
                    productId: parseInt(cartProductId),
                    quantity: parseInt(quantity)
                })
            });

            if (!res.ok) {
                const errorBody = await res.json();
                throw new Error(errorBody.error || "Failed to add to cart");
            }

            alert("Product added to cart!");
            window.location.href = "/cart/retrieve/all"; // Redirect to cart page
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
});
