document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");
   
    if (!token) {
        window.location.href = "/login";
        return;
    }

    const checkoutButton = document.getElementById("checkout-button");
    checkoutButton.addEventListener("click", async function () {
    

     const memberId = localStorage.getItem("memberId");

    try {
        // Call backend to place order
        const res = await fetch(`/checkout/placeorder/${memberId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to place order");

        alert("Order placed successfully!");

        // Clear cart locally
        localStorage.removeItem("cartProductId");

        // Redirect back to cart page
        window.location.href = "/cart/retrieve/all/";
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});


    fetchCheckout(token);
});

function fetchCheckout(token) {
    const memberId = localStorage.getItem("memberId");
     
    fetch(`/checkout/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(body => {
        if (body.error) throw new Error(body.error);

        const tbody = document.querySelector("#cart-items-tbody");
        tbody.innerHTML = '';

        body.items.forEach(item => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.productId}</td>
                <td>${item.unitPrice}</td>
                <td>${item.quantity}</td>
                <td>${item.discountedPrice.toFixed(2)}</td>
            `;

            tbody.appendChild(row);
        });

        const summaryDiv = document.getElementById("cart-summary");
        summaryDiv.innerHTML = `
            <div>Total Price: ${body.totalPrice.toFixed(2)}</div>
        `;
    })
    .catch(err => console.error(err));
}
