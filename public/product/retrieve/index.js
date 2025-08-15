// you can modify the code to suit your needs

function fetchProduct(productId) {
    const token = localStorage.getItem("token");

    return fetch(`/products/${productId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (body) {
            if (body.error) throw new Error(body.error);
            const product = body.product;
            const tbody = document.querySelector("#product-tbody");

            const row = document.createElement("tr");
            row.classList.add("product");
            const nameCell = document.createElement("td");
            const descriptionCell = document.createElement("td");
            const unitPriceCell = document.createElement("td");
            const countryCell = document.createElement("td");
            const productTypeCell = document.createElement("td");
            const imageUrlCell = document.createElement("td");
            const manufacturedOnCell = document.createElement("td");
            
            nameCell.textContent = product.name
            descriptionCell.textContent = product.description;
            unitPriceCell.textContent = product.unitPrice;
            countryCell.textContent = product.country;
            productTypeCell.textContent = product.productType;
            imageUrlCell.innerHTML = `<img src="${product.imageUrl}" alt="Product Image">`;
            manufacturedOnCell.textContent = new Date(product.manufacturedOn).toLocaleString();

            row.appendChild(nameCell);
            row.appendChild(descriptionCell);
            row.appendChild(unitPriceCell);
            row.appendChild(countryCell);
            row.appendChild(productTypeCell);
            row.appendChild(imageUrlCell);
            row.appendChild(manufacturedOnCell);
            tbody.appendChild(row);

        })
        .catch(function (error) {
            console.error(error);
        });
}

function fetchProductReviews(productId) {
    const token = localStorage.getItem("token");
    
    let url = `/reviews?productId=${productId}`;

    return fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (body) {
            if (body.error) throw new Error(body.error);
            const reviews = body.reviews;

            const reviewsContainer = document.querySelector('#reviews-container');

            reviews.forEach(function (review) {
                const reviewDiv = document.createElement('div');
                reviewDiv.classList.add('review-row');
                let ratingStars = '';
                for (let i = 0; i < review.rating; i++) {
                    ratingStars += '⭐';
                }

                reviewDiv.innerHTML += `            
                    <h3>Member Username: ${review.username}</h3>
                    <p>Rating: ${ratingStars}</p>
                    <p>Review Text: ${review.reviewText}</p>
                    <p>Last Updated: ${review.lastUpdatedDate ? new Date(review.lastUpdatedDate).toLocaleString():""} </p>
                `;

                reviewsContainer.appendChild(reviewDiv);        
            });

        })
        .catch(function (error) {
            console.error(error);
        });
}

document.addEventListener('DOMContentLoaded', function () {

    const productId = localStorage.getItem("productId");

    fetchProduct(productId)
        .then(function (productData) {
            return fetchProductReviews(productId);
        })
        .then(function () {
            // Both fetchProduct and fetchProductReviews have been called
            console.log('Both fetchProduct and fetchProductReviews have been called');
        })
        .catch(function (error) {
            // Handle error
            console.error(error);
        });
});


