
// you can modify the code

function fetchUserReviews() {
	const token = localStorage.getItem("token");

	return fetch(`/review/retrieve/all`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	})
		.then(res => {
			if (!res.ok) throw new Error("Failed to fetch reviews.");
			return res.json();
		})
		.then(body => {
			if (!Array.isArray(body)) throw new Error("Unexpected response");

			const reviewContainerDiv = document.querySelector('#review-container');
			reviewContainerDiv.innerHTML = '';

			body.forEach(function (review) {
				const reviewDiv = document.createElement('div');
				reviewDiv.classList.add('review-row');

				let ratingStars = '⭐'.repeat(review.rating);

				reviewDiv.innerHTML = `
					<h3>Review ID: ${review.id}</h3>
					<p>Product ID: ${review.product_id}</p>
					<p>Rating: ${ratingStars}</p>
					<p>Review Text: ${review.review_text}</p>
					<p>Created At: ${new Date(review.created_at).toLocaleString()}</p>
					<form method="POST" action="/review/delete">
						<input type="hidden" name="review_id" value="${review.id}" />
						<button type="submit">Delete</button>
					</form>
					<form method="GET" action="/review/update">
						<input type="hidden" name="review_id" value="${review.id}" />
						<button type="submit">Update</button>
					</form>
				`;

				reviewContainerDiv.appendChild(reviewDiv);
			});
		})
		.catch(function (error) {
			console.error("Fetch Error:", error.message);
		});
}

document.addEventListener('DOMContentLoaded', function () {
	fetchUserReviews();
});
