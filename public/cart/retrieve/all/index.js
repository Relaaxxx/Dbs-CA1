document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem("token"); // get the token after login


    if (!token) {
        console.warn("No token found. Redirecting to login page...");
        window.location.href = "/login";
        return;
    }

    // Decode JWT to get memberId
    const payload = JSON.parse(atob(token.split('.')[1]));
    const memberId = payload.memberId;

    const checkoutButton = document.getElementById("checkout-button");
    checkoutButton.addEventListener("click", function () {
        window.location.href = "/checkout";
    });

    await fetchCartItems(token, memberId);
    await fetchCartSummary(token, memberId);
});

async function fetchCartItems(token, memberId) {
    try {
        const response = await fetch(`/carts/${memberId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const body = await response.json();
        if (body.error) throw new Error(body.error);

        const cartItems = body.cartItems;
        const tbody = document.querySelector("#cart-items-tbody");
        tbody.innerHTML = '';

        cartItems.forEach(item => {
            const row = document.createElement("tr");

            const descCell = document.createElement("td");
            descCell.textContent = item.description;

            const countryCell = document.createElement("td");
            countryCell.textContent = item.country;

            const unitPriceCell = document.createElement("td");
            unitPriceCell.textContent = item.unit_price;

            const quantityCell = document.createElement("td");
            const quantityInput = document.createElement("input");
            quantityInput.type = "number";
            quantityInput.value = item.quantity;
            quantityCell.appendChild(quantityInput);

            const subTotalCell = document.createElement("td");
            subTotalCell.textContent = item.quantity * item.unit_price;

            const updateCell = document.createElement("td");
            const updateButton = document.createElement("button");
            updateButton.textContent = "Update";
            updateButton.addEventListener("click", function () {
                const updatedQuantity = Number(quantityInput.value);
                fetch('/carts', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ cartItemId: item.cart_item_id, quantity: updatedQuantity })
                }).then(() => location.reload());
            });
            updateCell.appendChild(updateButton);

            const deleteCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", function () {
                fetch(`/carts/${item.cart_item_id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                }).then(() => location.reload());
            });
            deleteCell.appendChild(deleteButton);

            row.appendChild(descCell);
            row.appendChild(countryCell);
            row.appendChild(unitPriceCell);
            row.appendChild(quantityCell);
            row.appendChild(subTotalCell);
            row.appendChild(updateCell);
            row.appendChild(deleteCell);

            tbody.appendChild(row);
        });
    } catch (err) {
        console.error(err);
    }
}

function fetchCartSummary(token, memberId) {
    return fetch(`/carts/summary/${memberId}`, {  // Include memberId in URL
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(body => {
        if (body.error) throw new Error(body.error);
        const summaryDiv = document.getElementById("cart-summary");
        summaryDiv.innerHTML = `
            Total Quantity: ${body.cartSummary.total_quantity} <br>
            Total Price: ${body.cartSummary.total_price} <br>
            
        `;
    })
    .catch(err => console.error(err));
}